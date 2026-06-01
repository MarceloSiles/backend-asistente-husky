require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { findFaqAnswer, faq } = require('./faq');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'consultas.jsonl');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF.'));
    }
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

async function askOpenAI(question, faqContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) return null;

  const systemPrompt = `Sos el asistente técnico de Husky Software. Respondé en español argentino, con tono claro, amable y práctico. Ayudás a usuarios finales de Husky Gestión Comercial. No inventes funciones. Cuando el caso requiera soporte técnico o técnico en PC, indicalo claramente. No menciones archivos CDX porque el sistema no los usa. El módulo de contabilidad está discontinuado y no debe presentarse como vigente.`;

  const knowledge = faq.map((item, index) => `Caso ${index + 1}: palabras clave: ${item.keywords.join(', ')}\nRespuesta: ${item.answer}`).join('\n\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `Base de conocimiento inicial de Husky:\n\n${knowledge}` },
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
  return data.choices?.[0]?.message?.content?.trim() || null;
}

async function buildAnswer(question, req) {
  const faqAnswer = findFaqAnswer(question);
  let answer = faqAnswer;
  let source = faqAnswer ? 'faq' : 'default';

  try {
    const aiAnswer = await askOpenAI(question, faqAnswer);
    if (aiAnswer) {
      answer = aiAnswer;
      source = 'openai';
    }
  } catch (error) {
    console.error(error.message);
  }

  if (!answer) {
    answer = `Hola, soy el asistente de Husky Software. No encontré una respuesta exacta para esa consulta, pero puedo orientarte. Contame qué módulo estabas usando, qué mensaje aparece y en qué momento ocurre. Si se trata de archivos dañados, facturación electrónica, certificados o errores de conexión con AFIP/ARCA, probablemente deba revisarlo soporte técnico de Husky.`;
  }

  saveLog({ question, answer, source, ip: req.ip });
  return { answer, source };
}

app.get('/api', (req, res) => {
  res.json({
    name: 'Backend Asistente Husky',
    status: 'online',
    endpoints: ['/health', '/api/health', '/chat', '/chat-image', '/chat-test?message=No%20puedo%20pedir%20CAE', '/stats', '/demo', '/demo.html', '/embed.js']
  });
});

app.get('/demo', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'demo.html'));
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'backend-asistente-husky', time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend-asistente-husky', time: new Date().toISOString() });
});

app.post('/chat', async (req, res) => {
  const question = String(req.body?.message || req.body?.question || '').trim();

  if (!question) {
    return res.status(400).json({ error: 'Falta el mensaje del usuario.' });
  }

  const result = await buildAnswer(question, req);
  res.json(result);
});

app.post('/chat-image', upload.single('image'), async (req, res) => {
  const question = String(req.body?.message || req.body?.question || '').trim();
  const image = req.file;

  if (!image) {
    return res.status(400).json({ error: 'Falta la imagen.' });
  }

  const answer = `Recibí la imagen correctamente: ${image.originalname}. En el próximo paso vamos a conectar el análisis automático para que pueda leer la captura y responder según el error que aparezca. Si querés, mientras tanto escribí también el mensaje de error que se ve en la imagen.`;

  saveLog({
    question: question || '(consulta con imagen sin texto)',
    answer,
    source: 'image-upload',
    image: {
      originalname: image.originalname,
      mimetype: image.mimetype,
      size: image.size,
      filename: image.filename
    },
    ip: req.ip
  });

  res.json({
    answer,
    source: 'image-upload',
    image: {
      originalname: image.originalname,
      mimetype: image.mimetype,
      size: image.size
    }
  });
});

app.get('/chat-test', async (req, res) => {
  const question = String(req.query?.message || '').trim();

  if (!question) {
    return res.status(400).json({
      error: 'Falta el parámetro message.',
      example: '/chat-test?message=No%20puedo%20pedir%20CAE'
    });
  }

  const result = await buildAnswer(question, req);
  res.json({ question, ...result });
});

app.get('/stats', (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.json({ total: 0, recent: [] });
  }

  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const recent = lines.slice(-20).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean).reverse();

  res.json({ total: lines.length, recent });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Error al procesar la solicitud.' });
});

app.listen(PORT, () => {
  console.log(`Backend Asistente Husky escuchando en puerto ${PORT}`);
});
