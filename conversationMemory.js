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
  if (compact.includes('guiam') || compact.includes('guiame') || compact.includes('guias')) return true;
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

function getGuidedFollowUpAnswer(session) {
  const last = getLastTurn(session);
  if (!last) return null;

  const combined = normalize(`${last.q}\n${last.effectiveQ}\n${last.answer}`);

  if (
    combined.includes('datos.zip') &&
    combined.includes('param.mem') &&
    combined.includes('config.mem') &&
    combined.includes('rece.mem')
  ) {
    return `Claro 😊 Te guío paso a paso.

La idea es recuperar desde DATOS.ZIP solamente estos archivos:
- PARAM.MEM
- CONFIG.MEM
- RECE.MEM

Paso 1: Cerrá Husky en todas las PCs.
No debe quedar abierto en ninguna terminal.

Paso 2: Buscá la carpeta del sistema.
Generalmente es C:\\Husky, pero puede estar en otra ubicación.

Si no sabés dónde está:
- Buscá el acceso directo de Husky en el Escritorio.
- Hacé clic derecho sobre el acceso directo.
- Entrá en Propiedades.
- Mirá el campo Destino o Iniciar en. Ahí vas a ver la carpeta donde está instalado el sistema.

Paso 3: Entrá a esa carpeta.
Buscá un archivo llamado DATOS.ZIP.

Paso 4: Abrí DATOS.ZIP con doble clic.
No extraigas todo el contenido. Solo vamos a recuperar 3 archivos.

Paso 5: Dentro de DATOS.ZIP, buscá estos archivos:
- PARAM.MEM
- CONFIG.MEM
- RECE.MEM

Paso 6: Copiá o extraé únicamente esos 3 archivos dentro de la carpeta del sistema.
Windows te puede preguntar si querés reemplazar los archivos existentes.
Respondé que sí.

Paso 7: Cuando termine la copia, abrí Husky nuevamente.
Probá si el error desapareció.

⚠️ Importante:
No extraigas todo DATOS.ZIP completo, porque podrías pisar otros datos del sistema. Solo deben recuperarse PARAM.MEM, CONFIG.MEM y RECE.MEM.`;
  }

  if (combined.includes('clientes.bak') && combined.includes('clientes.tbk')) {
    return `Claro 😊 Te guío paso a paso.

Este caso está relacionado con el archivo de clientes.

Primero te recomiendo la opción más segura:

Paso 1: Cerrá Husky en todas las PCs.
Paso 2: Entrá a la carpeta del sistema.
Paso 3: Buscá los archivos CLIENTES.BAK y CLIENTES.TBK.
Paso 4: Enviá esos dos archivos al soporte técnico de Husky Software para intentar repararlos.

Si es una urgencia y necesitás probar una recuperación manual:

Paso 1: Verificá que CLIENTES.BAK y CLIENTES.TBK sean recientes, idealmente del día anterior o como máximo de 1 día de antigüedad.

Paso 2: Cerrá Husky en todas las PCs.

Paso 3: Entrá a la carpeta del sistema.
Generalmente es C:\\Husky, pero puede estar en otra ubicación.

Si no sabés dónde está:
- Clic derecho sobre el acceso directo de Husky.
- Propiedades.
- Mirá Destino o Iniciar en.

Paso 4: Buscá los archivos dañados:
- CLIENTES.DBF
- CLIENTES.FPT

Paso 5: Cambiales el nombre para no perderlos:
- CLIENTES.DBF → CLIENTES_DAÑADO.DBF
- CLIENTES.FPT → CLIENTES_DAÑADO.FPT

Paso 6: Renombrá los backups:
- CLIENTES.BAK → CLIENTES.DBF
- CLIENTES.TBK → CLIENTES.FPT

Paso 7: Abrí Husky y probá nuevamente.

⚠️ Si no estás seguro, no lo hagas solo. En ese caso es mejor enviar los archivos al soporte de Husky.`;
  }

  return null;
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
    answer: String(answer || '').slice(0, 2200),
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
  isHowToFollowUp,
  getGuidedFollowUpAnswer
};
