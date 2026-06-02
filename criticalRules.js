const { findTextRuleAnswer } = require('./textRuleSearch');

function findCriticalRuleAnswer(input) {
  const result = findTextRuleAnswer(input);
  if (result) {
    return { id: result.id, answer: result.answer };
  }
  return null;
}

module.exports = { findCriticalRuleAnswer, rules: [] };
