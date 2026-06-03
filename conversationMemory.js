const crypto = require('crypto');
const { detectTopic, normalize } = require('./gptMasterRules');

const sessions = new Map();
const TTL_MS = 30 * 60 * 1000;
const MAX_HISTORY = 8;

function now() {
  return Date.now();
}

function getSessionId(req) {
  const fromBody = req.body?.sessionId || req.body?.session_id || req.body?.conversationId || req.body?.conversation_id;
  const fromQuery = req.query?.sessionId || req.query?.session_id || req.query?.conversationId || req.query?.conversation_id;
  const fromHeader = req.headers['x-session-id'] || req.headers['x-conversation-id'];
  return String(fromBody || fromQuery || fromHeader || req.ip || 'default').slice(0, 120);
}

function isShortFollowUp(text) {
  const q = normalize(text);
  if (!q) return false;
  const words = q.split(' ').filter(Boolean);
  if (words.length <= 4) return true;
  if (/^(si|sí|no|ok|dale|correcto|exacto|linea|línea|version|versión|es|usa|tiene|aparece|dice)\b/i.test(q)) return true;
  if (/^(linea|línea)\s*\d+$/i.test(q)) return true;
  if (/^\d+$/.test(q)) return true;
  if (/^(v|version|versión)\s*\d+$/i.test(q)) return true;
  return false;
}

function cleanup() {
  const t = now();
  for (const [id, session] of sessions.entries()) {
    if (t - session.updatedAt > TTL_MS) sessions.delete(id);
  }
}

function getSession(req) {
  cleanup();
  const id = getSessionId(req);
  if (!sessions.has(id)) {
    sessions.set(id, { id, history: [], topicText: '', topics: [], updatedAt: now() });
  }
  return sessions.get(id);
}

function shouldResetConversation(text) {
  const q = normalize(text);
  return q.includes('nueva consulta') || q.includes('otra consulta') || q.includes('empezar de nuevo') || q.includes('reiniciar chat') || q.includes('borrar chat');
}

function buildContextualQuestion(question, req) {
  const session = getSession(req);
  const original = String(question || '').trim();

  if (shouldResetConversation(original)) {
    session.history = [];
    session.topicText = '';
    session.topics = [];
    session.updatedAt = now();
    return { question: original, session, contextualized: false };
  }

  const currentTopics = detectTopic(original);
  let contextualQuestion = original;
  let contextualized = false;

  if (!currentTopics.length && session.topicText && isShortFollowUp(original)) {
    contextualQuestion = `${session.topicText}\nDato adicional del usuario: ${original}`;
    contextualized = true;
  }

  return { question: contextualQuestion, session, contextualized };
}

function updateSessionAfterAnswer(session, originalQuestion, effectiveQuestion, answer, source) {
  const detected = detectTopic(effectiveQuestion || originalQuestion);
  const original = String(originalQuestion || '').trim();
  const effective = String(effectiveQuestion || originalQuestion || '').trim();

  if (detected.length) {
    session.topics = detected;
    session.topicText = effective.length > 15 ? effective : `${session.topicText}\n${effective}`.trim();
  }

  session.history.push({
    q: original,
    effectiveQ: effective,
    answer: String(answer || '').slice(0, 1200),
    source,
    topics: detected,
    time: new Date().toISOString()
  });

  if (session.history.length > MAX_HISTORY) session.history = session.history.slice(-MAX_HISTORY);
  session.updatedAt = now();
}

function getSessionDebug(req) {
  const session = getSession(req);
  return {
    id: session.id,
    topicText: session.topicText,
    topics: session.topics,
    history: session.history
  };
}

module.exports = {
  getSessionId,
  buildContextualQuestion,
  updateSessionAfterAnswer,
  getSessionDebug,
  isShortFollowUp
};
