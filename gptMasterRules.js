const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUNDLE_DIRS = [
  path.join(__dirname, 'knowledge', 'gpt_master_bundle'),
  path.join(__dirname, 'knowledge'),
  __dirname
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
  const stop = new Set([
    'que','con','para','por','una','uno','del','los','las','como','cuando','donde','este','esta','esto','hay','sin','pero','sistema','husky','software','me','mi','al','el','la','lo','un','de','en','y','o','error','aparece','mensaje','consulta','quiero','puedo','hacer','dice','sale','como','algo'
  ]);
  return normalize(text).split(' ').filter(w => w.length >= 3 && !stop.has(w));
}

let cachedText = null;
let cachedBlocks = null;
let loadedFrom = null;

function readBundleFromDir(dir) {
  if (!fs.existsSync(dir)) return '';
  const names = fs.readdirSync(dir)
    .filter(name => /^part\d+\.b64$/i.test(name))
    .sort();
  if (!names.length) return '';
  const parts = names.map(name => fs.readFileSync(path.join(dir, name), 'utf8').trim()).join('');
  if (!parts) return '';
  loadedFrom = dir;
  return zlib.gunzipSync(Buffer.from(parts, 'base64')).toString('utf8');
}

function loadMasterText() {
  if (cachedText !== null) return cachedText;
  cachedText = '';

  for (const dir of BUNDLE_DIRS) {
    try {
      const text = readBundleFromDir(dir);
      if (text) {
        cachedText = text;
        break;
      }
    } catch (error) {
      console.error(`No se pudo leer bundle maestro en ${dir}:`, error.message);
    }
  }

  return cachedText;
}

function splitBlocks(text) {
  const clean = String(text || '').replace(/\r\n/g, '\n');
  const markers = /\n(?=(?:===== GPT_SOURCE_FILE:|## NOTA PARA EL MODELO|# NOTA PARA EL MODELO|NOTA PARA EL MODELO|NOTAS PARA EL MODELO|## NOTAS PARA EL MODELO|TEMA:|# Tema:|Tema:|DISPARADOR:|DISPARADORES:|RESPUESTA OBLIGATORIA|PRIORIDAD ABSOLUTA|INTERCEPCIÓN PRIORITARIA|INTERCEPCION PRIORITARIA|CONSULTA:|\*\*Consulta:\*\*|### ))/i;
  const raw = clean.split(markers).map(p => p && p.trim()).filter(Boolean);
  const blocks = [];

  for (const textPart of raw) {
    if (textPart.length < 80) continue;
    if (/^(DISPARADOR(?:ES)?|RESPUESTA OBLIGATORIA|PRIORIDAD ABSOLUTA|NOTA PARA EL MODELO)$/i.test(textPart)) continue;
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

function hasAny(q, words) {
  return words.some(w => q.includes(normalize(w)));
}

function detectTopic(query) {
  const q = normalize(query);
  const topics = [];
  const add = (id, phrases) => { if (hasAny(q, phrases)) topics.push(id); };

  add('ver_stru_fe', ['ver_stru_fe', 'ver stru fe', 'ver-stru-fe']);
  add('reindexa', ['reindexa linea 23', 'reindexa linea 90', 'reindexa linea 91', 'reindexa linea 92', 'reindexa linea 93', 'reindexa']);
  add('duplicidad', ['duplicidad en la numeracion', 'duplicidad en la numeración']);
  add('stock', ['stock insuficiente', 'no hay stock', 'no hay stock suficiente', 'sin stock', 'quiero facturar igual', 'me frena por stock']);
  add('recibo', ['borrar recibo', 'eliminar recibo', 'anular recibo', 'corregir recibo', 'recibo mal hecho']);
  add('factura_blanco', ['factura sale en blanco', 'factura se imprime en blanco', 'factura sin articulos', 'factura sin artículos', 'imprime solo totales', 'factura vacia']);
  add('factura_sin_membrete', ['factura sin membrete', 'sin datos de la empresa', 'sin encabezado', 'no aparece el qr', 'sin qr', 'sin cae']);
  add('impresion', ['factura sale cortada', 'imprime chiquito', 'sale como ticket', 'no sale en a4', 'impresora equivocada', 'sale en la comandera']);
  add('memoria', ['archivo de memoria', 'param.mem', 'config.mem', 'rece.mem', 'no existe la variable hk1', '.mem']);
  add('pdf', ['pdf creator', 'no genera pdf', 'microsoft print to pdf', 'no responde pdf creator']);
  add('wsafipfe', ['wsafipfe', 'wafipfe', 'dll factura electronica', 'dll factura electrónica', 'no se puede iniciar la aplicacion wsafipfe']);
  add('afip_ticket', ['fallo al intentar obtener el ticket', 'falló al intentar obtener el ticket', 'error en token', 'wsaa.afip.gov.ar', 'no se puede resolver el nombre remoto']);
  add('error_10242', ['10242']);
  add('error_10243', ['10243']);
  add('recursos', ['archivo de recursos no es valido', 'archivo de recursos no es válido', 'sobreescribirlo con uno vacio']);
  add('tabla_dbf', ['no es una tabla', 'dbf']);
  add('dolares', ['facturar en dolares', 'facturar en dólares', 'tipo de cambio', 'cancela en dolares', 'cancela en dólares']);
  add('cheque', ['cheque rechazado']);
  add('retenciones', ['retenciones', 'percepciones', 'impuestos internos']);
  add('yahoo', ['yahoo', 'smtp.mail.yahoo.com']);
  add('gmail', ['gmail', 'smtp.gmail.com']);
  add('tmusb64', ['tmusb64', 'integridad de memoria', 'aislamiento del nucleo']);

  return topics;
}

const topicMustInclude = {
  ver_stru_fe: ['ver_stru_fe', 'ver stru fe', 'linea 136'],
  reindexa: ['reindexa'],
  duplicidad: ['duplicidad en la numeracion', 'duplicidad en la numeración'],
  stock: ['stock insuficiente', 'no hay stock', 'permitir facturar aunque no haya stock', 'permitir remitir aunque no haya stock'],
  recibo: ['recibo'],
  factura_blanco: ['factura sale en blanco', 'factura se imprime en blanco', 'factura sin articulos', 'factura sin artículos', 'imprime solo totales'],
  factura_sin_membrete: ['sin membrete', 'no aparece el qr', 'sin qr', 'sin cae', 'punto de venta manual'],
  impresion: ['factura sale cortada', 'imprime chiquito', 'sale como ticket', 'no sale en a4', 'ticket-factura', 'comandera'],
  memoria: ['archivo de memoria', 'param.mem', 'config.mem', 'rece.mem', 'no existe la variable hk1'],
  pdf: ['pdf creator', 'microsoft print to pdf'],
  wsafipfe: ['wsafipfe', 'wafipfe'],
  afip_ticket: ['fallo al intentar obtener el ticket', 'error en token', 'wsaa.afip.gov.ar', 'no se puede resolver el nombre remoto'],
  error_10242: ['10242'],
  error_10243: ['10243'],
  recursos: ['archivo de recursos'],
  tabla_dbf: ['no es una tabla'],
  dolares: ['facturar en dolares', 'facturar en dólares', 'tipo de cambio', 'cancela en dolares', 'cancela en dólares'],
  cheque: ['cheque rechazado'],
  retenciones: ['retenciones', 'percepciones', 'impuestos internos'],
  yahoo: ['yahoo'],
  gmail: ['gmail'],
  tmusb64: ['tmusb64', 'integridad de memoria']
};

function blockMatchesTopics(block, topics) {
  if (!topics.length) return true;
  const hay = normalize(`${block.title}\n${block.text}`);
  return topics.some(topic => (topicMustInclude[topic] || []).some(p => hay.includes(normalize(p))));
}

function extractDisparadores(blockText) {
  const out = [];
  const re = /(DISPARADOR(?:ES)?|Consulta \/ Mensaje típico|Consulta|Mensaje típico)\s*:?([\s\S]{0,1200})/ig;
  let match;
  while ((match = re.exec(blockText)) !== null) {
    const section = match[2].split(/\n\s*\n|RESPUESTA|Qué significa|Que significa|Causa|Solución|Procedimiento|Tema:|NOTA PARA EL MODELO/i)[0];
    section.split(/\n|;|,/).forEach(line => {
      const cleaned = line.replace(/^[-*•\s"“”]+|["“”]+$/g, '').trim();
      if (cleaned.length >= 4 && cleaned.length <= 160) out.push(cleaned);
    });
  }
  return out;
}

const strongPhrases = Object.values(topicMustInclude).flat();

function scoreBlock(query, block) {
  const q = normalize(query);
  const hay = normalize(`${block.title}\n${block.text}`);
  const qt = tokens(query);
  const topics = detectTopic(query);
  let score = 0;

  if (!q) return 0;
  if (!blockMatchesTopics(block, topics)) return 0;
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
  if (topics.length) score += 80;
  if (qt.length >= 2 && tokenHits === 0 && score < 250) score = 0;
  if (qt.length >= 3 && tokenHits < 2 && score < 250) score = 0;

  return score;
}

function stripInternalLines(text) {
  return String(text || '')
    .split('\n')
    .filter(line => {
      const n = normalize(line);
      if (!n.trim()) return true;
      if (/^(disparador|disparadores|nota para el modelo|notas para el modelo|prioridad absoluta|intercepcion prioritaria|intercepción prioritaria|respuesta obligatoria|prohibido para el modelo|reglas del modelo|regla final para el modelo|consulta \/ mensaje tipico|consulta \/ mensaje típico)\b/i.test(line.trim())) return false;
      if (n.includes('el asistente debe') || n.includes('el asistente no debe')) return false;
      if (n.includes('prohibido para el modelo')) return false;
      return true;
    })
    .join('\n');
}

function cleanAnswer(blockText) {
  let text = String(blockText || '').trim();

  const responseMarkers = [
    /RESPUESTA OBLIGATORIA(?:\s*\([^)]*\))?\s*:?/i,
    /Respuesta al usuario\s*:?/i,
    /Respuesta correcta\s*:?/i,
    /Respuesta\s*:?/i,
    /Qué hacer\s*:?/i,
    /Que hacer\s*:?/i,
    /Procedimiento oficial\s*:?/i,
    /Solución \(oficial\)[^:]*\s*:?/i,
    /Solución\s*:?/i,
    /Causa\s*:?/i
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

  text = stripInternalLines(text)
    .replace(/^===== GPT_SOURCE_FILE:.*?=====\s*/is, '')
    .replace(/^##?\s*/gm, '')
    .replace(/^TEMA:\s*/gim, '')
    .replace(/^#\s*Tema:\s*/gim, '')
    .replace(/^Tema:\s*/gim, '')
    .replace(/\n\s*PROHIBIDO PARA EL MODELO:[\s\S]*$/i, '')
    .replace(/\n\s*REGLAS DEL MODELO[\s\S]*$/i, '')
    .replace(/\n\s*REGLA FINAL PARA EL MODELO[\s\S]*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  text = stripInternalLines(text).trim();
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
    .filter(block => block.score >= 120)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const answer = applyStyle(cleanAnswer(best.text));
  if (!answer || answer.length < 20) return null;
  if (/disparador|nota para el modelo|respuesta obligatoria|prohibido para el modelo/i.test(answer)) return null;

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
    loadedFrom,
    bundleDirs: BUNDLE_DIRS
  };
}

module.exports = { findGptMasterAnswer, getGptMasterStatus, normalize, detectTopic };