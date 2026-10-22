const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Quiz, grade } = require('../quiz');
const bank = require('../questions.json');

test('seeded selection and partial credit', () => {
  let now = 1000;
  const quiz = new Quiz(bank, () => now);
  const first = quiz.start(42, 4, 60);
  const second = quiz.start(42, 4, 60);
  assert.deepEqual(first.questions, second.questions);
  assert.equal(first.questions.some(q => Object.hasOwn(q, 'answer')), false);
  assert.equal(grade(bank[1], ['TCP']), 0.5);
  assert.equal(grade(bank[1], ['TCP', 'IP']), 0);
  for (const q of bank) quiz.save(first.id, q.id, q.answer);
  assert.equal(quiz.submit(first.id).total, 4);
  assert.equal(quiz.statistics().q1.attempts, 1);
  now = second.deadline;
  assert.throws(() => quiz.submit(second.id), /closed/);
});

