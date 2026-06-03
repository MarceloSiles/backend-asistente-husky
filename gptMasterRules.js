const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUNDLE_DIR = path.join(__dirname, 'knowledge', 'gpt_master_bundle');

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
  const stop = new Set([
    'que','con','para','por','una','uno','del','los','las','como','cuando','donde','este','esta','esto','hay','sin','pero','sistema','husky','software','me','mi','al','el','la','lo','un','de','en','y','o','error','aparece','mensaje','consulta','quiero','puedo','hacer'
  ]);
  return normalize(text).split(' ').filter(w => w.length >= 3 && !stop.has(w));
}

let cachedText = null;
let cachedBlocks = null;

function loadMasterText() {
  if (cachedText !== null) return cachedText;
  cachedText = '';

  try {
    if (fs.existsSync(BUNDLE_DIR)) {
      const parts = fs.readdirSync(BUNDLE_DIR)
        .filter(name => /^part\d+\.b64$/i.test(name))
        .sort()
        .map(name => fs.readFileSync(path.join(BUNDLE_DIR, name), 'utf8').trim())
        .join('');

      if (parts) {
        cachedText = zlib.gunzipSync(Buffer.from(parts, 'base64')).toString('utf8');
      }
    }
  } catch (error) {
    console.error('No se pudo leer gpt_master_bundle:', error.message);
    cachedText = '';
  }

  return cachedText;
}

function splitBlocks(text) {
  const clean = String(text || '').replace(/\r\n/g, '\n');
  const markers = /\n(?=(===== GPT_SOURCE_FILE:|## NOTA PARA EL MODELO|# NOTA PARA EL MODELO|NOTA PARA EL MODELO|NOTAS PARA EL MODELO|## NOTAS PARA EL MODELO|TEMA:|# Tema:|Tema:|DISPARADOR:|DISPARADORES:|RESPUESTA OBLIGATORIA|PRIORIDAD ABSOLUTA|INTERCEPCIÓN PRIORITARIA|INTERCEPCION PRIORITARIA|CONSULTA:|\*\*Consulta:\*\*|### ))/i;
  const raw = clean.split(markers).map(p => p && p.trim()).filter(Boolean);
  const blocks = [];

  for (let i = 0; i < raw.length; i++) {
    const textPart = raw[i];
    if (textPart.length < 80) continue;
    const firstLine = textPart.split('\n').find(Boolean) || '';
    blocks.push({
      id: `gpt-master-${blocks.length + 1}`,
      title: firstLine.slice(0, 160),
      text: textPart
    });
  }

  return blocks;
}

function getBlocks() {
  if (cachedBlocks) return cachedBlocks;
  cachedBlocks = splitBlocks(loadMasterText());
  return cachedBlocks;
}

function extractDisparadores(blockText) {
  const out = [];
  const re = /(DISPARADOR(?:ES)?|Consulta \/ Mensaje típico|Consulta|Mensaje típico)\s*:?([\s\S]{0,900})/ig;
  let match;
  while ((match = re.exec(blockText)) !== null) {
    const section = match[2].split(/\n\s*\n|RESPUESTA|Qué significa|Que significa|Causa|Solución|Procedimiento|Tema:/i)[0];
    section.split(/\n|;|,/).forEach(line => {
      const cleaned = line.replace(/^[-*•\s"“”]+|["“”]+$/g, '').trim();
      if (cleaned.length >= 4 && cleaned.length <= 160) out.push(cleaned);
    });
  }
  return out;
}

const strongPhrases = [
  'ver_stru_fe','ver stru fe','reindexa linea 23','reindexa linea 90','reindexa linea 91','reindexa linea 92','reindexa linea 93','linea 136',
  'duplicidad en la numeracion','duplicidad en la numeración','proximo numero sera','próximo número será',
  'no hay stock suficiente','stock insuficiente','permitir facturar aunque no haya stock','permitir remitir aunque no haya stock',
  'factura sale en blanco','factura se imprime en blanco','factura sin articulos','factura sin artículos','imprime solo totales',
  'factura sin membrete','sin datos de la empresa','no aparece el qr','sin cae',
  'factura sale cortada','imprime chiquito','sale como ticket','no sale en a4','impresora equivocada','comandera',
  'archivo de recursos no es valido','archivo de recursos no es válido','sobreescribirlo con uno vacio',
  'certificado expirado','certificate expired','archivo de memoria','param.mem','config.mem','rece.mem','no existe la variable hk1',
  'fallo al intentar obtener el ticket','falló al intentar obtener el ticket','error en token','wsaa.afip.gov.ar','no se puede resolver el nombre remoto',
  'error inesperado de recepcion','error inesperado de recepción','se ha terminado la conexion','se ha terminado la conexión',
  '10242','10243','condicion iva receptor','condición iva receptor',
  'pdf creator','microsoft print to pdf','no genera pdf','no responde pdf creator',
  'gmail','smtp.gmail.com','yahoo','smtp.mail.yahoo.com',
  'wsafipfe','wafipfe','dll factura electronica','dll factura electrónica','no se puede iniciar la aplicacion wsafipfe',
  'no es una tabla','no se puede borrar el objeto que esta en uso','no se puede actualizar el objeto cursor','error interno de coherencia','cannot locate the microsoft visual foxpro support library',
  'borrar recibo','eliminar recibo','anular recibo','recibo mal hecho',
  'nota de credito','nota de crédito','cheque rechazado','retenciones','percepciones','impuestos internos',
  'facturar en dolares','facturar en dólares','tipo de cambio','cancela en dolares','cancela en dólares',
  'reportes 8010','formulario 8010','formulario 8011','impresora fiscal','tmusb64','integridad de memoria'
];

function scoreBlock(query, block) {
  const q = normalize(query);
  const hay = normalize(`${block.title}\n${block.text}`);
  const qt = tokens(query);
  let score = 0;

  if (!q) return 0;
  if (hay.includes(q)) score += 200;

  for (const phrase of strongPhrases) {
    const p = normalize(phrase);
    if (q.includes(p) && hay.includes(p)) score += 250;
  }

  const disparadores = extractDisparadores(block.text);
  for (const d of disparadores) {
    const dn = normalize(d);
    if (dn && (q.includes(dn) || dn.includes(q))) score += 300;
  }

  let tokenHits = 0;
  for (const t of qt) {
    if (hay.includes(t)) {
      tokenHits += 1;
      score += normalize(block.title).includes(t) ? 18 : 5;
    }
  }

  if (/prioridad absoluta|respuesta obligatoria|intercepci[oó]n prioritaria|prohibido para el modelo|nota para el modelo/i.test(block.text)) score += 35;
  if (qt.length >= 2 && tokenHits === 0) score = 0;
  if (qt.length >= 3 && tokenHits < 2 && score < 250) score = 0;

  return score;
}

function cleanAnswer(blockText) {
  let text = String(blockText || '').trim();

  const responseMarkers = [
    /RESPUESTA OBLIGATORIA(?:\s*\([^)]*\))?\s*:?/i,
    /Respuesta al usuario\s*:?/i,
    /Respuesta correcta\s*:?/i,
    /RESPUESTA\s*:?/i,
    /Qué hacer\s*:?/i,
    /Que hacer\s*:?/i,
    /Procedimiento oficial\s*:?/i,
    /Solución \(oficial\)[^:]*\s*:?/i,
    /Solución\s*:?/i
  ];

  let start = -1;
  let markerLength = 0;
  for (const re of responseMarkers) {
    const m = text.match(re);
    if (m && typeof m.index === 'number' && (start === -1 || m.index < start)) {
      start = m.index;
      markerLength = m[0].length;
    }
  }
  if (start >= 0) text = text.slice(start + markerLength).trim();

  text = text
    .replace(/^===== GPT_SOURCE_FILE:.*?=====\s*/is, '')
    .replace(/^##?\s*NOTAS? PARA EL MODELO.*?\n+/i, '')
    .replace(/^NOTAS? PARA EL MODELO.*?\n+/i, '')
    .replace(/^PRIORIDAD ABSOLUTA.*?\n+/i, '')
    .replace(/^TEMA:\s*/i, '')
    .replace(/^#\s*Tema:\s*/i, '')
    .replace(/^Tema:\s*/i, '')
    .replace(/^DISPARADORES?:[\s\S]*?(\n\s*\n|$)/i, '')
    .replace(/^Consulta \/ Mensaje típico:[\s\S]*?(\n\s*\n|$)/i, '')
    .replace(/^Consulta:[\s\S]*?(\n\s*\n|$)/i, '')
    .replace(/\n\s*El asistente (NO|no|debe|DEBE)[\s\S]*$/i, '')
    .replace(/\n\s*PROHIBIDO PARA EL MODELO:[\s\S]*$/i, '')
    .replace(/\n\s*REGLAS DEL MODELO[\s\S]*$/i, '')
    .replace(/\n\s*REGLA FINAL PARA EL MODELO[\s\S]*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function applyStyle(answer) {
  let text = String(answer || '').trim();
  if (!text) return text;

  if (!/^(hola|tranquilo|perfecto|sí|si|no|ese|este|esto|vamos|te cuento|en este caso)/i.test(text)) {
    text = `Hola 😊\n\n${text}`;
  }

  return text;
}

function findGptMasterAnswer(input) {
  const blocks = getBlocks();
  if (!blocks.length) return null;

  const scored = blocks
    .map(block => ({ ...block, score: scoreBlock(input, block) }))
    .filter(block => block.score >= 70)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const answer = applyStyle(cleanAnswer(best.text));
  if (!answer || answer.length < 20) return null;

  return {
    id: best.id,
    title: best.title,
    score: best.score,
    answer
  };
}

function getGptMasterStatus() {
  return {
    loaded: Boolean(loadMasterText()),
    chars: loadMasterText().length,
    blocks: getBlocks().length,
    bundleDir: BUNDLE_DIR
  };
}

module.exports = { findGptMasterAnswer, getGptMasterStatus, normalize };
