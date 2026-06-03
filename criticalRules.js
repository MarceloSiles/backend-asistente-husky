const { findTextRuleAnswer } = require('./textRuleSearch');
const { findDeterministicExtraRuleAnswer } = require('./deterministicExtraRules');

function findCriticalRuleAnswer(input) {
  const extra = findDeterministicExtraRuleAnswer(input);
  if (extra) {
    return { id: extra.id, answer: extra.answer };
  }

  const result = findTextRuleAnswer(input);
  if (result) {
    return { id: result.id, answer: result.answer };
  }
  return null;
}

module.exports = { findCriticalRuleAnswer, rules: [] };
