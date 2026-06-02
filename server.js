require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { findFaqAnswer, faq } = require('./faq');
const { loadKnowledgeChunks, searchKnowledge, formatKnowledgeContext } = require('./knowledge');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'consultas.jsonl');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF.'));
    cb(null, true);
  }
});

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

function saveLog(entry) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error('No se pudo guardar la consulta:', err.message);
  });
}

function hasOpenAIKey() {
  const value = process.env.OPENAI_API_KEY;
  return Boolean(value && value.trim().length > 10);
}

function getSystemPrompt() {
  return `Sos el asistente técnico de Husky Software. Respondé en español argentino, con tono claro, amable y práctico. Ayudás a usuarios finales de Husky Gestión Comercial. No inventes funciones. Usá primero la base de conocimiento provista. Cuando el caso requiera soporte técnico de Husky o un técnico en PC, indicalo claramente. No menciones archivos CDX porque el sistema no los usa. El módulo de contabilidad está discontinuado y no debe presentarse como vigente. Si analizás una captura, explicá lo que se ve con prudencia y pedí más datos si la imagen no es legible.`;
}

function getFaqText() {
  return faq.map((item, index) => `Caso FAQ ${index + 1}: palabras clave: ${item.keywords.join(', ')}\nRespuesta: ${item.answer}`).join('\n\n');
}

function buildKnowledgeSystemMessage(question) {
  const results = searchKnowledge(question, 5);
  const docsContext = formatKnowledgeContext(results);
  const faqText = getFaqText();

  let content = `Base FAQ inicial de Husky:\n\n${faqText}`;
  if (docsContext) {
    content += `\n\nBase documental encontrada para esta consulta:\n\n${docsContext}`;
  }
  return { content, results };
}

async function askOpenAI(question) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) return null;

  const knowledge = buildKnowledgeSystemMessage(question);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'system', content: knowledge.content },
        { role: 'user', content: question }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI respondió ${response.status}: ${text}`);
  }

  const data = await response.json();
  return {
    answer: data.choices?.[0]?.message?.content?.trim() || null,
    knowledgeResults: knowledge.results
  };
}

async function askOpenAIVision(question, image) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) return null;

  const userText = question || 'Analizá esta captura o imagen relacionada con Husky Gestión Comercial. Identificá mensajes de error visibles y explicá qué debería hacer el usuario.';
  const knowledge = buildKnowledgeSystemMessage(userText);
  const base64Image = fs.readFileSync(image.path, 'base64');
  const dataUrl = `data:${image.mimetype};base64,${base64Image}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'system', content: knowledge.content },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI visión respondió ${response.status}: ${text}`);
  }

  const data = await response.json();
  return {
    answer: data.choices?.[0]?.message?.content?.trim() || null,
    knowledgeResults: knowledge.results
  };
}

async function buildAnswer(question, req) {
  const faqAnswer = findFaqAnswer(question);
  let answer = faqAnswer;
  let source = faqAnswer ? 'faq' : 'default';
  let knowledgeResults = searchKnowledge(question, 5);

  try {
    const ai = await askOpenAI(question);
    if (ai?.answer) {
      answer = ai.answer;
      source = ai.knowledgeResults?.length ? 'openai-knowledge' : 'openai';
      knowledgeResults = ai.knowledgeResults || knowledgeResults;
    }
  } catch (error) {
    console.error(error.message);
  }

  if (!answer) {
    answer = `Hola, soy el asistente de Husky Software. No encontré una respuesta exacta para esa consulta, pero puedo orientarte. Contame qué módulo estabas usando, qué mensaje aparece y en qué momento ocurre. Si se trata de archivos dañados, facturación electrónica, certificados o errores de conexión con AFIP/ARCA, probablemente deba revisarlo soporte técnico de Husky.`;
  }

  saveLog({
    question,
    answer,
    source,
    knowledgeSources: knowledgeResults.map((r) => ({ filename: r.filename, index: r.index, score: r.score })),
    ip: req.ip
  });
  return { answer, source };
}

app.get('/api', (req, res) => {
  res.json({
    name: 'Backend Asistente Husky',
    status: 'online',
    endpoints: ['/health', '/api/health', '/chat', '/chat-image', '/knowledge-status', '/knowledge-search?q=CAE', '/debug-config', '/openai-test', '/stats', '/demo', '/embed.js']
  });
});

app.get('/knowledge-status', (req, res) => {
  const chunks = loadKnowledgeChunks();
  const files = [...new Set(chunks.map((chunk) => chunk.filename))];
  res.json({ ok: true, files, chunks: chunks.length });
});

app.get('/knowledge-search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q.' });
  const results = searchKnowledge(q, 5).map((r) => ({ filename: r.filename, index: r.index, score: r.score, preview: r.text.slice(0, 500) }));
  res.json({ query: q, results });
});

app.get('/debug-config', (req, res) => {
  const key = process.env.OPENAI_API_KEY || '';
  const chunks = loadKnowledgeChunks();
  res.json({
    service: 'backend-asistente-husky',
    openaiApiKeyConfigured: hasOpenAIKey(),
    openaiApiKeyLength: key ? key.length : 0,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    openaiVisionModel: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    knowledgeChunks: chunks.length,
    knowledgeFiles: [...new Set(chunks.map((chunk) => chunk.filename))],
    nodeEnv: process.env.NODE_ENV || null,
    time: new Date().toISOString()
  });
});

app.get('/openai-test', async (req, res) => {
  if (!hasOpenAIKey()) {
    return res.status(500).json({ ok: false, step: 'env', message: 'El backend no está leyendo OPENAI_API_KEY. Revisar Environment en Render y hacer Deploy latest commit.' });
  }
  try {
    const ai = await askOpenAI('Respondé solamente: OK');
    res.json({ ok: true, source: 'openai', answer: ai?.answer });
  } catch (error) {
    res.status(500).json({ ok: false, step: 'openai-call', message: error.message.slice(0, 500) });
  }
});

app.get('/demo', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'demo.html')));
app.get('/health', (req, res) => res.json({ ok: true, service: 'backend-asistente-husky', time: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'backend-asistente-husky', time: new Date().toISOString() }));

app.post('/chat', async (req, res) => {
  const question = String(req.body?.message || req.body?.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Falta el mensaje del usuario.' });
  const result = await buildAnswer(question, req);
  res.json(result);
});

app.post('/chat-image', upload.single('image'), async (req, res) => {
  const question = String(req.body?.message || req.body?.question || '').trim();
  const image = req.file;
  if (!image) return res.status(400).json({ error: 'Falta la imagen.' });

  let answer = null;
  let source = 'image-upload';
  let debugError = null;
  let knowledgeResults = [];

  try {
    const ai = await askOpenAIVision(question, image);
    if (ai?.answer) {
      answer = ai.answer;
      source = ai.knowledgeResults?.length ? 'openai-vision-knowledge' : 'openai-vision';
      knowledgeResults = ai.knowledgeResults || [];
    }
  } catch (error) {
    debugError = error.message;
    console.error(error.message);
  }

  if (!answer) {
    if (!hasOpenAIKey()) {
      answer = `Recibí la imagen correctamente: ${image.originalname}. El backend todavía no está leyendo la variable OPENAI_API_KEY en Render. Revisá que esté cargada en el servicio backend-asistente-husky y luego hacé Manual Deploy → Deploy latest commit.`;
    } else {
      answer = `Recibí la imagen correctamente: ${image.originalname}, pero OpenAI no pudo analizarla. Revisá /openai-test para ver el error técnico. Puede ser modelo no disponible, clave inválida, falta de crédito o permisos de la API.`;
    }
  }

  saveLog({
    question: question || '(consulta con imagen sin texto)',
    answer,
    source,
    debugError,
    knowledgeSources: knowledgeResults.map((r) => ({ filename: r.filename, index: r.index, score: r.score })),
    image: { originalname: image.originalname, mimetype: image.mimetype, size: image.size, filename: image.filename },
    ip: req.ip
  });

  res.json({ answer, source, image: { originalname: image.originalname, mimetype: image.mimetype, size: image.size } });
});

app.get('/chat-test', async (req, res) => {
  const question = String(req.query?.message || '').trim();
  if (!question) return res.status(400).json({ error: 'Falta el parámetro message.', example: '/chat-test?message=No%20puedo%20pedir%20CAE' });
  const result = await buildAnswer(question, req);
  res.json({ question, ...result });
});

app.get('/stats', (req, res) => {
  if (!fs.existsSync(LOG_FILE)) return res.json({ total: 0, recent: [] });
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const recent = lines.slice(-20).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean).reverse();
  res.json({ total: lines.length, recent });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Error al procesar la solicitud.' });
});

app.listen(PORT, () => console.log(`Backend Asistente Husky escuchando en puerto ${PORT}`));
