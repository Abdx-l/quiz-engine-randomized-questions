const http = require('node:http');
const bank = require('./questions.json');
const { Quiz } = require('./quiz');
const quiz = new Quiz(bank);

function respond(res, status, payload) { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(payload)); }
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/stats') return respond(res, 200, quiz.statistics());
  if (req.method !== 'POST') return respond(res, 404, { error: 'not found' });
  let raw = '';
  req.on('data', chunk => { raw += chunk; if (raw.length > 65536) req.destroy(); });
  req.on('end', () => {
    try {
      const body = JSON.parse(raw || '{}');
      if (req.url === '/attempts') return respond(res, 201, quiz.start(body.seed || 0, body.count, body.durationSeconds));
      const match = /^\/attempts\/([^/]+)\/(answers|submit)$/.exec(req.url);
      if (!match) return respond(res, 404, { error: 'not found' });
      if (match[2] === 'answers') { quiz.save(match[1], body.questionId, body.answer); return respond(res, 200, { saved: true }); }
      return respond(res, 200, quiz.submit(match[1]));
    } catch (error) { return respond(res, 400, { error: error.message }); }
  });
});
if (require.main === module) server.listen(Number(process.env.PORT || 8080), '127.0.0.1');
module.exports = { server };

