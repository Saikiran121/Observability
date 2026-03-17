require('./tracing');
const express = require('express');
const client = require('prom-client');
const axios = require('axios');
const app = express();
const port = 3000;

// Prometheus Metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const requestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const requestDurationSummary = new client.Summary({
  name: 'http_request_duration_summary_seconds',
  help: 'Summary of HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  percentiles: [0.5, 0.9, 0.99],
});

const activeRequestsGauge = new client.Gauge({
  name: 'active_requests',
  help: 'Number of active requests',
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  activeRequestsGauge.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    activeRequestsGauge.dec();
    
    // Skip metrics for /metrics endpoint to avoid noise
    if (req.path !== '/metrics') {
      const labels = {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      };
      
      httpRequestCounter.labels(labels).inc();
      requestDurationHistogram.labels(labels).observe(duration);requestDurationSummary.labels(labels).observe(duration);
    }
  });
  next();
});

// Async function to simulate a task
const simulateTask = async () => {
  const delay = Math.random() * 2000; // 0 to 2 seconds
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Service A');
});

app.get('/healthy', (req, res) => {
  res.json({ status: 'UP' });
});

app.get('/serverError', (req, res) => {
  res.status(500).send('Internal Server Error');
});

app.get('/notFound', (req, res) => {
  res.status(404).send('Not Found');
});

app.get('/logs', (req, res) => {
  console.log('Log entry generated');
  res.send('Logs generated');
});

app.get('/crash', (req, res) => {
  res.send('Crashing server...');
  process.exit(1);
});

app.get('/example', async (req, res) => {
  try {
    await simulateTask();
    const serviceBUrl = process.env.SERVICE_B_URL || 'http://localhost:3001';
    const response = await axios.get(`${serviceBUrl}/data`);
    res.json({
      message: 'Example route success',
      serviceBData: response.data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to call Service B', details: error.message });
  }
});


// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(port, () => {
  console.log(`Service A listening at http://localhost:${port}`);
});
