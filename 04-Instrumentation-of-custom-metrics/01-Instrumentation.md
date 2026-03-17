# 01 - Application Instrumentation: Coding for Observability

**Instrumentation** is the process of adding code to your application that exposes internal state and events to a monitoring system like Prometheus. Unlike "Black-box" monitoring (which checks if the server is up), instrumentation is **"White-box" monitoring**—it tells you what's happening *inside* your logic.

---

## 🏗️ The 4 Metric Types in Code

When you use a **Prometheus Client Library**, you must map your business logic to one of these four types.

### 1. The Counter (`Counter`)
Used for values that only increase (e.g., total requests, total errors).
- **Code (Python)**:
  ```python
  from prometheus_client import Counter
  REQUESTS = Counter('http_requests_total', 'Total HTTP Requests')
  
  def handle_request():
      REQUESTS.inc()  # Increments by 1
  ```

### 2. The Gauge (`Gauge`)
Used for values that go up and down (e.g., active users, CPU usage, temperature).
- **Code (Python)**:
  ```python
  from prometheus_client import Gauge
  ACTIVE_USERS = Gauge('active_users', 'Users currently online')
  
  def user_login():
      ACTIVE_USERS.inc() # +1
  def user_logout():
      ACTIVE_USERS.dec() # -1
  ```

### 3. The Histogram (`Histogram`)
Used for distributions (e.g., response time, payload size). It counts observations into "buckets."
- **Code (Python)**:
  ```python
  from prometheus_client import Histogram
  LATENCY = Histogram('request_latency_seconds', 'Response time in seconds')
  
  @LATENCY.time()  # Decorator automatically observes duration
  def process_data():
      # ... expensive logic ...
      pass
  ```

### 4. The Summary (`Summary`)
Similar to Histograms, but calculates configurable quantiles over a sliding time window.

---

## 🛠️ Step-by-Step Implementation (Python Example)

To expose metrics, you need to start a small HTTP server inside your app that Prometheus can scrape.

```python
from prometheus_client import start_http_server, Counter, Gauge
import time
import random

# 1. Initialize metrics
PROCESS_TIME = Gauge('app_process_duration_seconds', 'Time spent processing')
ORDERS = Counter('app_orders_total', 'Total orders processed', ['status'])

if __name__ == '__main__':
    # 2. Start the /metrics endpoint on port 8000
    start_http_server(8000)
    print("Metrics server started on port 8000")

    while True:
        # 3. Record data in your logic
        with PROCESS_TIME.track_inprogress():
            time.sleep(random.random()) # Simulate work
            
        status = 'success' if random.random() > 0.1 else 'failure'
        ORDERS.labels(status=status).inc() # Use labels for dimensionality
```

---

## 🌟 Real-World Scenarios

### Scenario 1: Tracking Payment Success Rates
**Problem**: You want to know if Your Stripe integration is failing more than usual.
- **Implementation**: Create a Counter `payment_total{provider="stripe", status="failure|success"}`.
- **Value**: You can alert on `sum(rate(payment_total{status="failure"}[5m])) > 1`.

### Scenario 2: Memory Leak in a Background Worker
**Problem**: Your Python background worker keeps getting OOM killed.
- **Implementation**: Create a Gauge `worker_memory_usage_bytes`.
- **Value**: If the Gauge line is a steady "staircase" up, you have a memory leak in your code.

---

## 🚀 "Useful to Very Useful" Instrumentation Examples

Beyond the basics, here are the patterns that separate average monitoring from world-class observability.

### 1. Database Query Performance (Highly Useful)
Don't just monitor the DB server; monitor how your code *perceives* the DB.
```python
DB_QUERY_DURATION = Histogram('db_query_duration_seconds', 'Time spent on DB queries', ['query_type'])

def get_user_data(user_id):
    with DB_QUERY_DURATION.labels(query_type='select').time():
        return db.execute("SELECT * FROM users WHERE id=?", user_id)
```
- **Why**: Tells you if a specific query is slow, even if the DB CPU is low.

### 2. External Service/API Health (Critical)
If your app calls Stripe, Twilio, or AWS, you MUST instrument those calls.
```python
EXTERNAL_API_CALLS = Counter('external_api_requests_total', 'External API calls', ['service', 'status'])

def send_notification(msg):
    try:
        twilio.send(msg)
        EXTERNAL_API_CALLS.labels(service='twilio', status='success').inc()
    except:
        EXTERNAL_API_CALLS.labels(service='twilio', status='failure').inc()
```
- **Why**: Proves that "The site is slow because Twilio is down," not because your code is broken.

### 3. Connection Pool Monitoring (Expert Level)
Track if your app is running out of database or thread connections.
```python
DB_CONNECTIONS = Gauge('db_connection_pool_status', 'Active vs Idle DB connections', ['state'])

# In your pool manager:
DB_CONNECTIONS.labels(state='active').set(pool.active_count())
DB_CONNECTIONS.labels(state='idle').set(pool.idle_count())
```
- **Why**: Helps you prevent "Connection Timeout" crashes BEFORE they happen.

### 4. Automatic HTTP Middleware (The "Low Hanging Fruit")
Instead of instrumenting every function, use middleware to track every request automatically.
```javascript
// Ex: Node.js/Express Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    HTTP_REQUEST_DURATION.labels(req.method, req.path, res.statusCode).observe(duration / 1000);
  });
  next();
});
```
- **Why**: Gives you 80% of your monitoring value with 1% effort.

---

## ✅ Best Practices
1.  **Metric Naming**: Use the "Base Name + Unit + Suffix" convention (e.g., `http_request_duration_seconds_sum`).
2.  **Labels are Key**: Use labels like `method="GET"` or `endpoint="/login"` instead of creating separate metrics for each.
3.  **Low Cardinality**: Never use unique things like `user_email` as a label. Each unique label combination creates a new time series in Prometheus memory!
4.  **Global Registry**: Most libraries use a "Default Registry." Register your metrics there so they all show up on the same `/metrics` page.

> "A well-instrumented application is not just easier to monitor; it's easier to debug, scale, and understand."
