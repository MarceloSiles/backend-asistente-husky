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
  if (words.length <= 6) return true;
  if (/^(si|sí|no|ok|dale|correcto|exacto|linea|línea|version|versión|es|usa|tiene|aparece|dice|donde|dónde|cual|cuál|como|cómo|ayuda|ayudame|ayúdame|guiame|guiáme|guia|guía)\b/i.test(q)) return true;
  if (/^(linea|línea)\s*\d+$/i.test(q)) return true;
  if (/^\d+$/.test(q)) return true;
  if (/^(v|version|versión)\s*\d+$/i.test(q)) return true;
  return false;
}

function isHowToFollowUp(text) {
  const q = normalize(text);
  if (!q) return false;

  const compact = q.replace(/\s+/g, '');

  const phrases = [
    'como lo hago', 'cómo lo hago', 'como hago', 'cómo hago', 'como se hace', 'cómo se hace',
    'no entiendo', 'no entendi', 'no entendí', 'no se hacerlo', 'no sé hacerlo', 'no se como', 'no sé cómo',
    'no se donde', 'no sé dónde', 'no se que tocar', 'no sé qué tocar',
    'explicame', 'explícame', 'explicamelo', 'explícamelo', 'paso a paso', 'pasame los pasos',
    'dame los pasos', 'decime los pasos', 'decime como', 'decime cómo',
    'donde entro', 'dónde entro', 'donde esta', 'dónde está', 'a donde voy', 'a dónde voy',
    'que hago ahora', 'qué hago ahora', 'que tengo que hacer', 'qué tengo que hacer',
    'que toco', 'qué toco', 'que boton', 'qué botón', 'que archivo', 'qué archivo',
    'me guias', 'me guiás', 'guiame', 'guiáme', 'guia me', 'guía me',
    'ayudame', 'ayúdame', 'ayuda', 'me ayudas', 'me ayudás', 'acompañame', 'acompañáme'
  ];

  if (phrases.some(p => q.includes(normalize(p)))) return true;

  // Usuarios suelen escribir rápido o incompleto: "guiam", "guiam por favor", "nose hacerlo".
  if (compact.includes('guiam') || compact.includes('guiame') || compact.includes('guias') || compact.includes('guias')) return true;
  if (compact.includes('nosehacerlo') || compact.includes('nosecomo') || compact.includes('noentiendo')) return true;
  if (compact.includes('pasoapaso') || compact.includes('pasamelospasos') || compact.includes('damelospasos')) return true;
  if (compact.includes('ayudame') || compact.includes('ayuda')) return true;

  const words = q.split(' ').filter(Boolean);
  if (words.length <= 7 && (q.includes('como') || q.includes('cómo') || q.includes('guia') || q.includes('guía') || q.includes('ayuda'))) return true;

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

function getLastTurn(session) {
  if (!session || !session.history || !session.history.length) return null;
  return session.history[session.history.length - 1];
}

function buildFollowUpExpansionPrompt(original, session) {
  const last = getLastTurn(session);
  if (!last) return null;

  return `El usuario está continuando una conversación anterior del asistente de Husky Software.

Consulta anterior del usuario:
${last.effectiveQ || last.q}

Respuesta anterior del asistente:
${last.answer}

Nueva repregunta del usuario:
${original}

Respondé como continuación, no como una consulta nueva.
Llevá al usuario de la mano, suponiendo que sabe muy poco de Windows y del sistema.
Usá siempre este formato:

Paso 1: ...
Paso 2: ...
Paso 3: ...

Hacé pasos cortos, simples y concretos.
No agregues temas nuevos. No cambies de caso. No menciones fuentes internas ni reglas.`;
}

function buildContextualQuestion(question, req) {
  const session = getSession(req);
  const original = String(question || '').trim();

  if (shouldResetConversation(original)) {
    session.history = [];
    session.topicText = '';
    session.topics = [];
    session.updatedAt = now();
    return { question: original, session, contextualized: false, followUpExpansion: false, expansionPrompt: null };
  }

  const currentTopics = detectTopic(original);
  let contextualQuestion = original;
  let contextualized = false;
  let followUpExpansion = false;
  let expansionPrompt = null;

  if (session.topicText && isHowToFollowUp(original)) {
    expansionPrompt = buildFollowUpExpansionPrompt(original, session);
    if (expansionPrompt) {
      contextualQuestion = expansionPrompt;
      contextualized = true;
      followUpExpansion = true;
    }
  } else if (!currentTopics.length && session.topicText && isShortFollowUp(original)) {
    contextualQuestion = `${session.topicText}\nDato adicional del usuario: ${original}`;
    contextualized = true;
  }

  return { question: contextualQuestion, session, contextualized, followUpExpansion, expansionPrompt };
}

function updateSessionAfterAnswer(session, originalQuestion, effectiveQuestion, answer, source) {
  const detected = detectTopic(effectiveQuestion || originalQuestion);
  const original = String(originalQuestion || '').trim();
  const effective = String(effectiveQuestion || originalQuestion || '').trim();

  if (detected.length) {
    session.topics = detected;
    session.topicText = effective.length > 15 ? effective : `${session.topicText}\n${effective}`.trim();
  } else if (!session.topicText && effective.length > 15) {
    session.topicText = effective;
  }

  session.history.push({
    q: original,
    effectiveQ: effective,
    answer: String(answer || '').slice(0, 1800),
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
  isShortFollowUp,
  isHowToFollowUp
};
