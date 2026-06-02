const { findTextRuleAnswer } = require('./textRuleSearch');

function findExactRuleAnswer(input) {
  return findTextRuleAnswer(input);
}

module.exports = { findExactRuleAnswer };
