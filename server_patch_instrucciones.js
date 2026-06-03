// server_patch_instrucciones.js
// Este archivo es una guía. NO lo subas como server.js.

// 1) En server.js, reemplazá la línea:
const { buildContextualQuestion, updateSessionAfterAnswer, getSessionDebug } = require('./conversationMemory');

// por:
const {
  buildContextualQuestion,
  updateSessionAfterAnswer,
  getSessionDebug,
  getGuidedFollowUpAnswer
} = require('./conversationMemory');

// 2) Dentro de async function buildAnswer(question, req),
// justo después de:
// const contextual = buildContextualQuestion(originalQuestion, req);
// const effectiveQuestion = contextual.question;
// pegá este bloque ANTES de const rule = findRuleAnswer(effectiveQuestion);

  if (contextual.followUpExpansion) {
    const guided = getGuidedFollowUpAnswer(contextual.session);
    if (guided) {
      saveLog({
        question: originalQuestion,
        effectiveQuestion,
        contextualized: true,
        followUpExpansion: true,
        answer: guided,
        source: 'guided-followup',
        ip: req.ip
      });
      updateSessionAfterAnswer(contextual.session, originalQuestion, effectiveQuestion, guided, 'guided-followup');
      return { answer: guided, source: 'guided-followup', contextualized: true };
    }

    try {
      const ai = await askOpenAI(effectiveQuestion);
      if (ai?.answer) {
        saveLog({
          question: originalQuestion,
          effectiveQuestion,
          contextualized: true,
          followUpExpansion: true,
          answer: ai.answer,
          source: 'openai-followup',
          ip: req.ip
        });
        updateSessionAfterAnswer(contextual.session, originalQuestion, effectiveQuestion, ai.answer, 'openai-followup');
        return { answer: ai.answer, source: 'openai-followup', contextualized: true };
      }
    } catch (error) {
      console.error(error.message);
    }
  }
