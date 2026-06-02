const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s.:-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  const stopwords = new Set([
    'que', 'con', 'para', 'por', 'una', 'uno', 'unos', 'unas', 'del', 'los', 'las', 'the',
    'como', 'cuando', 'donde', 'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'hay', 'sin',
    'más', 'mas', 'muy', 'pero', 'tiene', 'tengo', 'hacer', 'hace', 'sale', 'aparece',
    'sistema', 'husky', 'software', 'error', 'mensaje'
  ]);

  return normalizeText(text)
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !stopwords.has(word));
}

function splitIntoChunks(text, filename) {
  const blocks = String(text || '')
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';
  let index = 1;

  for (const block of blocks) {
    if ((current + '\n\n' + block).length > 1200 && current.length > 0) {
      chunks.push({ filename, index: index++, text: current.trim() });
      current = block;
    } else {
      current = current ? `${current}\n\n${block}` : block;
    }
  }

  if (current.trim()) {
    chunks.push({ filename, index, text: current.trim() });
  }

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

function searchKnowledge(query, limit = 4) {
  const chunks = loadKnowledgeChunks();
  const queryTokens = tokenize(query);

  if (!queryTokens.length || !chunks.length) return [];

  const scored = chunks.map((chunk) => {
    const haystack = normalizeText(`${chunk.filename}\n${chunk.text}`);
    let score = 0;

    for (const token of queryTokens) {
      if (haystack.includes(token)) score += 1;
      if (haystack.includes(token + ' ')) score += 0.2;
    }

    return { ...chunk, score };
  })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

function formatKnowledgeContext(results) {
  if (!results || !results.length) return '';

  return results.map((item, idx) => {
    return `Documento ${idx + 1}: ${item.filename} - fragmento ${item.index}\n${item.text}`;
  }).join('\n\n---\n\n');
}

module.exports = {
  loadKnowledgeChunks,
  searchKnowledge,
  formatKnowledgeContext
};
