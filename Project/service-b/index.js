require('./tracing');
const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello from Service B!');
});

app.get('/data', (req, res) => {
  res.json({ message: 'Data from Service B', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`Service B listening at http://localhost:${port}`);
});
