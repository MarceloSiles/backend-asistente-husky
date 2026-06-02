const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

const SYNONYMS = {
  retroceso: ['reproceso'],
  reproceso: ['retroceso', 'saltos', 'numeracion'],
  cae: ['afip', 'arca', 'facturacion', 'electronica'],
  afip: ['arca', 'cae'],
  arca: ['afip', 'cae'],
  gmail: ['correo', 'mail', 'smtp'],
  correo: ['gmail', 'smtp'],
  impresora: ['impresion', 'ticket', 'comandera'],
  impresion: ['impresora', 'ticket', 'comandera'],
  stock: ['kardex', 'existencia'],
  clientes: ['clientes.dbf', 'clientes.fpt'],
  param: ['param.mem', 'config.mem', 'rece.mem'],
  certificado: ['pfx'],
  pfx: ['certificado']
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s._:()/-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompact(text) {
  return normalizeText(text).replace(/\s+/g, ' ').trim();
}

function tokenize(text) {
  const stopwords = new Set([
    'que', 'con', 'para', 'por', 'una', 'uno', 'unos', 'unas', 'del', 'los', 'las', 'the',
    'como', 'cuando', 'donde', 'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'hay', 'sin',
    'más', 'mas', 'muy', 'pero', 'tiene', 'tengo', 'hacer', 'hace', 'sale', 'aparece',
    'sistema', 'husky', 'software', 'me', 'mi', 'al', 'el', 'la', 'lo', 'un', 'de', 'en'
  ]);

  const tokens = normalizeText(text)
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !stopwords.has(word));

  const expanded = new Set(tokens);
  for (const token of tokens) {
    if (SYNONYMS[token]) {
      for (const synonym of SYNONYMS[token]) expanded.add(synonym);
    }
  }

  return Array.from(expanded);
}

function detectStrongPhrases(query) {
  const q = normalizeCompact(query);
  const phrases = [];

  const rawCandidates = [
    'reindexa linea 23',
    'reindexa linea 90',
    'reindexa linea 91',
    'reindexa linea 92',
    'reindexa linea 93',
    'ver_stru_fe linea 136',
    'no es una tabla',
    'certificado expirado',
    'archivo de recursos no es valido',
    'no se puede borrar el objeto que esta en uso',
    'no se puede actualizar el objeto cursor',
    'no hay stock suficiente',
    'stock insuficiente',
    'duplicidad en la numeracion',
    'factura sale en blanco',
    'factura se imprime en blanco',
    'factura sale sin articulos',
    'sin membrete',
    'no aparece el qr',
    'factura sale cortada',
    'factura imprime chiquito',
    'error 10242',
    'error 10243',
    'condicion iva receptor',
    'no se puede iniciar la aplicacion wsafipfe',
    'cannot locate the microsoft visual foxpro support library',
    'ticket expira en el futuro',
    'tiempo de expiracion es inferior',
    'generationtime',
    'generation time',
    'facturar en dolares',
    'cancela en dolares',
    'formulario 8010',
    'formulario 8011',
    'pdf creator',
    'makepdf',
    'print2pdf'
  ];

  for (const candidate of rawCandidates) {
    const normalized = normalizeCompact(candidate);
    if (q.includes(normalized)) phrases.push(normalized);
  }

  const reindexaLine = q.match(/reindexa\s+(linea\s+)?(23|90|91|92|93)/);
  if (reindexaLine) phrases.push(`reindexa linea ${reindexaLine[2]}`);

  const errorCode = q.match(/\b(10240|10242|10243|1081|400|404|500|501|502|503)\b/);
  if (errorCode) phrases.push(errorCode[1]);

  return Array.from(new Set(phrases));
}

function splitIntoChunks(text, filename) {
  const normalizedNewlines = String(text || '').replace(/\r\n/g, '\n');
  const sections = normalizedNewlines
    .split(/\n(?=(#{1,4}\s+|tema:|pregunta:|consulta:|error:|nota para el modelo|disparador|\d+\.\d+[-.–]))/i)
    .map((section) => section.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';
  let index = 1;
  const maxLength = filename.toLowerCase().includes('preguntas') ? 1800 : 1400;

  for (const section of sections) {
    const blocks = section.split(/\n\s*\n/g).map((b) => b.trim()).filter(Boolean);
    for (const block of blocks) {
      if ((current + '\n\n' + block).length > maxLength && current.length > 0) {
        chunks.push({ filename, index: index++, text: current.trim() });
        current = block;
      } else {
        current = current ? `${current}\n\n${block}` : block;
      }
    }
  }

  if (current.trim()) chunks.push({ filename, index, text: current.trim() });
  return chunks;
}

function loadKnowledgeChunks() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return [];

  const files = fs.readdirSync(KNOWLEDGE_DIR)
    .filter((file) => SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()));

  const chunks = [];

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    chunks.push(...splitIntoChunks(content, file));
  }

  return chunks;
}

function scoreChunk(chunk, query, queryTokens, strongPhrases) {
  const haystack = normalizeCompact(`${chunk.filename}\n${chunk.text}`);
  const file = normalizeCompact(chunk.filename);
  let score = 0;

  const normalizedQuery = normalizeCompact(query);
  if (normalizedQuery && haystack.includes(normalizedQuery)) score += 80;

  for (const phrase of strongPhrases) {
    if (haystack.includes(phrase)) score += 120;
  }

  for (const token of queryTokens) {
    if (!token) continue;

    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactWord = new RegExp(`(^|\\s|[._:/()-])${escaped}($|\\s|[._:/()-])`, 'i');

    if (exactWord.test(haystack)) score += token.match(/^\d+$/) ? 8 : 4;
    else if (haystack.includes(token)) score += 1.2;

    if (file.includes(token)) score += 2;
  }

  if (/respuesta obligatoria|prioridad absoluta|disparador/i.test(chunk.text)) score += 15;
  if (/preguntas[-_ ]frecuentes/i.test(chunk.filename)) score += 8;
  if (/manual/i.test(chunk.filename) && score > 0) score += 2;

  return score;
}

function searchKnowledge(query, limit = 8) {
  const chunks = loadKnowledgeChunks();
  const queryTokens = tokenize(query);
  const strongPhrases = detectStrongPhrases(query);

  if ((!queryTokens.length && !strongPhrases.length) || !chunks.length) return [];

  return chunks.map((chunk) => ({
    ...chunk,
    score: scoreChunk(chunk, query, queryTokens, strongPhrases)
  }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function formatKnowledgeContext(results) {
  if (!results || !results.length) return '';

  return results.map((item, idx) => {
    return `Documento ${idx + 1}: ${item.filename} - fragmento ${item.index} - relevancia ${item.score}\n${item.text}`;
  }).join('\n\n---\n\n');
}

module.exports = {
  loadKnowledgeChunks,
  searchKnowledge,
  formatKnowledgeContext,
  normalizeText,
  detectStrongPhrases
};
