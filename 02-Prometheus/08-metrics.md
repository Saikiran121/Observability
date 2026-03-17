# 08 - The /metrics Endpoint & Service Discovery

For Prometheus to monitor anything, there must be a "conversation." The application must expose its data, and Prometheus must find it. This is handled by the **Exposition Format** and **Service Discovery**.

---

## 📄 The /metrics Endpoint: The Application's Diary

Every application or exporter monitored by Prometheus exposes a URL (usually `/metrics`). When you visit this URL in a browser, you see a plain-text "diary" of how the application is performing.

### The Exposition Format
Each line in a `/metrics` endpoint follows a strict, human-readable format:

```text
# HELP http_requests_total The total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="post",code="200"} 1027
http_requests_total{method="post",code="400"} 3
```

-   **HELP**: A brief description of what the metric means.
-   **TYPE**: Whether it's a `counter`, `gauge`, `histogram`, or `summary`.
-   **Metric Name**: The unique identifier (e.g., `http_requests_total`).
-   **Labels**: Key-value pairs centered in `{}` that add context (e.g., `method="post"`).
-   **Value**: The current numeric state of the metric.

---

## 🏗️ Application-Level Metrics: Direct Instrumentation

While **Exporters** (like Node Exporter) monitor the environment, **Direct Instrumentation** is how you monitor your software's business logic. To do this, you use **Prometheus Client Libraries** (for Go, Python, Java, etc.).

### System Metrics vs. Business Metrics
-   **System Metrics**: Provided by the library automatically (e.g., Process CPU, Memory, Go Goroutines).
-   **Business Metrics**: Written by YOU to track ROI or App Health (e.g., `orders_processed_total`, `payment_latency_seconds`).

### Example: Tracking Checkout Success (Python)
Imagine you are writing a checkout service. You want to know how many orders are placed.

```python
from prometheus_client import start_http_server, Counter
import time

# 1. Define the metric (Counter)
ORDERS_COMPLETED = Counter('checkout_orders_total', 'Total orders successfully processed')

def process_order():
    # ... logic to process order ...
    # 2. Increment the metric
    ORDERS_COMPLETED.inc()

if __name__ == '__main__':
    # 3. Start the /metrics endpoint on port 8000
    start_http_server(8000)
    while True:
        process_order()
        time.sleep(1)
```

**What happens next?**
1.  The library creates a `/metrics` endpoint on `localhost:8000/metrics`.
2.  Prometheus scrapes this endpoint.
3.  You can now create a Grafana alert: *"Alert me if `rate(checkout_orders_total[5m])` drops to 0!"* (Which might mean your payment gateway is broken).

---

## 🕵️ Service Discovery (SD): The Hunter

In a static world, you would tell Prometheus: "Scrape IP 10.0.0.5." But in **Kubernetes (EKS)**, pods are dynamic—their IPs change every time they restart.

**Service Discovery** allows Prometheus to talk to the Kubernetes API and ask: *"Give me the IPs of all pods labeled `app=checkout`."*

### Key SD Roles in Kubernetes:
1.  **Node**: Finds all worker nodes in the cluster.
2.  **Pod**: Finds individual pods (used for app metrics).
3.  **Endpoints**: Finds the backend IPs behind a Kubernetes Service (most common for load-balanced apps).

---

## 🧹 Relabeling: The "Filter" after Discovery

Service Discovery provides a lot of "meta" information (like the pod's namespace, the node name, etc.). Relabeling is the process where Prometheus cleans this up before storing it.

**Example Scenario**:
You only want to monitor pods that have a specific annotation: `prometheus.io/scrape: "true"`.
- **SD Action**: Finds 1000 pods.
- **Relabeling Action**: Checks the annotations. If the annotation isn't there, it "drops" the target.
- **Result**: Prometheus only scrapes the 200 pods you actually care about, saving memory and CPU.

---

## 🌟 Real-World Scenarios

### Scenario 1: Scaling the E-commerce App
**Context**: It's Black Friday. You scale your Checkout service from 2 pods to 50 pods.
- **Without SD**: you would have to manually add 48 IPs to a config file and restart Prometheus.
- **With SD**: Prometheus automatically detects the 48 new pods via the K8s API and starts scraping their `/metrics` endpoints within seconds.

### Scenario 2: Troubleshooting a "Down" Target
**Problem**: Your Grafana dashboard shows "No Data" for your new Payment service.
- **Action**: You check the Prometheus "Targets" page. You see the Payment service listed but marked as **DOWN** with error `404 Not Found`.
- **Discovery**: You realize the developer exposed metrics at `/stats` instead of the default `/metrics`.
- **Fix**: You use relabeling or update the `ServiceMonitor` to point to the correct path.

---

## ✅ Best Practices
1.  **Standardize Paths**: Always use `/metrics` unless there is a critical reason not to.
2.  **Avoid High Cardinality**: Don't put "User IDs" or "Email addresses" in labels. This will create millions of series and crash your TSDB.
3.  **Label Consistency**: Ensure labels like `env` (production/staging) are applied to all metrics via relabeling for easy filtering in Grafana.

---

> "Service Discovery finds the target; the /metrics endpoint provides the story; together, they give you the complete picture of your system."
