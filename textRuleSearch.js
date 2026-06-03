const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const RULE_FILES = [
  'regla-archivos-mem-prioridad.txt',
  'reglas-prioritarias-nuevas.txt',
  'reglas-codigos-afip.txt',
  'reglas-impresion-reproceso.txt',
  'reglas-afip-conectividad.txt',
  'reglas-varias-prioritarias.txt',
  'reglas-comerciales-prioritarias.txt',
  'reglas-correo-windows-impresoras.txt',
  'reglas-instalacion-actualizacion.txt',
  'instrucciones-gpt-prioridad.txt',
  'certificado-expirado-prioritario.txt',
  'estilo-respuestas-usuarios-basicos.txt'
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s.*_/-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text) {
  const stop = new Set(['que','con','para','por','una','uno','del','los','las','como','cuando','donde','este','esta','esto','hay','sin','pero','sistema','husky','software','me','mi','al','el','la','lo','un','de','en','y','o','error','aparece','mensaje']);
  return normalize(text).split(' ').filter(w => w.length >= 3 && !stop.has(w));
}

function loadRuleSections() {
  const sections = [];
  for (const file of RULE_FILES) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const parts = text.split(/\n(?=(REGLA PRIORITARIA:|ERROR:|TEMA:|PRIORIDAD ABSOLUTA|IMPORTANTE SEGUN LA VERSION|CASO HUSKY|NOTA PARA EL MODELO|NOTAS PARA EL MODELO|NOTA:))/i)
      .map(p => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      const title = part.split('\n')[0] || file;
      sections.push({ file, title, text: part });
    }
  }
  return sections;
}

function scoreSection(query, section) {
  const q = normalize(query);
  const hay = normalize(section.title + '\n' + section.text);
  const qt = tokens(query);
  let score = 0;

  if (!q) return 0;
  if (hay.includes(q)) score += 100;

  const strong = [
    'ver_stru_fe', 'archivo de memoria', 'archivo mem', '.mem', 'param.mem', 'config.mem', 'rece.mem',
    'atencion factura no electronica', 'factura no electronica', 'comprobante no electronico',
    'importar articulos', 'importacion de articulos', 'formato excel articulos', 'excel para articulos',
    'error al leer el archivo', 'smart app control', 'archivo de recursos no valido',
    'duplicidad en la numeracion', 'no es una tabla', 'reindexa linea 23', 'reindexa linea 90',
    'reindexa linea 91', 'reindexa linea 92', 'reindexa linea 93',
    'factura sale en blanco', 'factura sin articulos', 'sin qr', 'sin cae', 'factura sin membrete',
    'factura sale cortada', 'sale como ticket', 'no sale en a4', 'impresora equivocada',
    'fallo al intentar obtener el ticket', 'fallo al obtener ticket', 'falló al intentar obtener el ticket',
    'error en token', 'wsaa', 'error inesperado de recepcion', 'se ha terminado la conexion',
    'tiempo de expiracion inferior', 'generationtime', 'zona horaria', 'archivo de recursos',
    'archivo raro', 'archivos raros', 'facturar en dolares', 'facturar en dólares', 'tipo de cambio',
    'borrar factura electronica', 'borrar factura electrónica', 'eliminar factura electronica',
    'cargar pedidos', 'pedido de cliente', 'convertir pedido en factura', 'agregar articulo',
    'agregar artículo', 'cargar articulo nuevo', 'cargar artículo nuevo', 'retenciones',
    'percepciones', 'impuestos internos', 'remito preimpreso', 'cai del remito',
    'yahoo', 'smtp.mail.yahoo.com', 'tmusb64', 'integridad de memoria', 'aislamiento del nucleo',
    'aislamiento del núcleo', 'ticket factura', 'ticket-factura', 'comandera', '80 mm', '8 cm',
    'actualizar husky', 'nueva version', 'nueva versión', 'windows 10', 'windows server',
    'pdf creator', 'microsoft print to pdf', 'wsafipfe', 'wafipfe', 'dll factura electronica',
    'dll factura electrónica', 'instalar en varias pc', 'terminales', 'multiusuario',
    '10242', '10243', 'condicion iva receptor', 'condición iva receptor'
  ];

  for (const phrase of strong) {
    if (q.includes(phrase) && hay.includes(phrase)) score += 120;
  }

  for (const t of qt) {
    if (hay.includes(t)) score += section.title && normalize(section.title).includes(t) ? 8 : 2;
  }

  if (/regla prioritaria|prioridad absoluta|respuesta obligatoria|nota para el modelo|notas para el modelo/i.test(section.text)) score += 15;

  if (qt.length > 0 && !qt.some(t => hay.includes(t))) score = 0;
  return score;
}

function cleanAnswer(section) {
  let text = section.text.trim();
  text = text.replace(/^REGLA PRIORITARIA:\s*/i, '');
  text = text.replace(/^ERROR:\s*/i, '');
  text = text.replace(/^TEMA:\s*/i, '');
  text = text.replace(/^NOTA PARA EL MODELO:?\s*/i, '');
  text = text.replace(/^NOTAS PARA EL MODELO:?\s*/i, '');
  text = text.replace(/^NOTA:?\s*/i, '');

  const marker = text.match(/Respuesta al usuario:\s*/i);
  if (marker && typeof marker.index === 'number') {
    text = text.slice(marker.index + marker[0].length);
  }

  text = text.replace(/^Disparadores:.*?(\n\n|$)/is, '');
  text = text.replace(/^Respuesta obligatoria:\s*/i, '');
  text = text.replace(/\n\n+/g, '\n\n').trim();
  return text;
}

function findTextRuleAnswer(query) {
  const sections = loadRuleSections();
  const scored = sections
    .map(section => ({ ...section, score: scoreSection(query, section) }))
    .filter(section => section.score >= 30)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  const best = scored[0];
  return {
    id: best.title.slice(0, 80),
    file: best.file,
    answer: cleanAnswer(best)
  };
}

module.exports = { findTextRuleAnswer, loadRuleSections };
