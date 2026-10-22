# Quiz Engine with Randomized Questions

A Node.js quiz service with seeded question selection and shuffled answer choices. Attempts have a server-side deadline, answer autosave, automatic grading, partial credit for multi-select, and per-question accuracy statistics.

```sh
node server.js
node --test
```

POST `/attempts` with `{"seed":42,"count":3,"durationSeconds":60}`. POST `/attempts/{id}/answers` with `{"questionId":"q1","answer":"A"}`, then POST `/attempts/{id}/submit`. GET `/stats` returns aggregate question accuracy. The included question bank demonstrates single choice, multi-select, true/false, and numeric tolerance. State is in memory for a single server process.

