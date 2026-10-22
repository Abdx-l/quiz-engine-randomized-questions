const crypto = require('node:crypto');

function rng(seed) {
  let value = seed >>> 0;
  return () => { value = (1664525 * value + 1013904223) >>> 0; return value / 2 ** 32; };
}
function shuffle(items, random) {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [output[i], output[j]] = [output[j], output[i]]; }
  return output;
}
function grade(question, answer) {
  if (question.type === 'numeric') return Math.abs(Number(answer) - question.answer) <= (question.tolerance || 0) ? 1 : 0;
  if (question.type === 'multi') {
    if (!Array.isArray(answer)) return 0;
    const selected = new Set(answer);
    const correct = new Set(question.answer);
    const earned = [...selected].filter(x => correct.has(x)).length;
    const wrong = [...selected].filter(x => !correct.has(x)).length;
    return Math.max(0, (earned - wrong) / correct.size);
  }
  return answer === question.answer ? 1 : 0;
}
class Quiz {
  constructor(bank, clock = () => Date.now()) { this.bank = bank; this.clock = clock; this.attempts = new Map(); this.stats = new Map(); }
  start(seed, count, durationSeconds) {
    if (!Number.isInteger(count) || count < 1 || count > this.bank.length || !(durationSeconds > 0)) throw Error('invalid count or duration');
    const random = rng(seed);
    const questions = shuffle(this.bank, random).slice(0, count).map(q => ({ ...q, options: q.options ? shuffle(q.options, random) : undefined }));
    const id = crypto.randomUUID();
    const attempt = { id, questions, answers: {}, deadline: this.clock() + durationSeconds * 1000, submitted: false };
    this.attempts.set(id, attempt);
    return { id, deadline: attempt.deadline, questions: questions.map(({ answer, tolerance, ...publicQuestion }) => publicQuestion) };
  }
  save(id, questionId, answer) {
    const attempt = this.attempts.get(id);
    if (!attempt) throw Error('unknown attempt');
    if (attempt.submitted || this.clock() >= attempt.deadline) throw Error('attempt closed');
    if (!attempt.questions.some(q => q.id === questionId)) throw Error('unknown question');
    attempt.answers[questionId] = answer;
  }
  submit(id) {
    const attempt = this.attempts.get(id);
    if (!attempt) throw Error('unknown attempt');
    if (attempt.submitted || this.clock() >= attempt.deadline) throw Error('attempt closed');
    attempt.submitted = true;
    const scores = attempt.questions.map(q => ({ id: q.id, score: grade(q, attempt.answers[q.id]) }));
    for (const row of scores) {
      const stat = this.stats.get(row.id) || { attempts: 0, scoreSum: 0 };
      stat.attempts++; stat.scoreSum += row.score; this.stats.set(row.id, stat);
    }
    return { id, scores, total: scores.reduce((sum, item) => sum + item.score, 0), outOf: scores.length };
  }
  statistics() { return Object.fromEntries([...this.stats].map(([id, value]) => [id, { ...value, meanScore: value.scoreSum / value.attempts }])); }
}
module.exports = { Quiz, grade, rng, shuffle };

