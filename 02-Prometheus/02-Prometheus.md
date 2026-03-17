# 02 - Prometheus: The Monitoring Powerhouse

Prometheus is an open-source systems monitoring and alerting toolkit. Originally built at SoundCloud, it is now a standalone open-source project and is the industry standard for monitoring cloud-native applications, especially those running on Kubernetes.

---

## 🏗️ Core Architecture

Prometheus is not just a database; it is a complete ecosystem.

### 1. Prometheus Server
The "brain" of the operation. It performs three main tasks:
-   **Retrieval (Scraping)**: Actively fetches metrics from targets.
-   **TSDB (Storage)**: Stores metrics in a highly efficient time-series database.
-   **PromQL**: Provides a powerful query language to analyze the data.

### 2. Exporters
Since many systems (like Linux, MySQL, or Nginx) don't speak "Prometheus" natively, **Exporters** act as translators.
-   **Example**: The **Node Exporter** translates Linux kernel metrics into Prometheus format.

### 3. Service Discovery
In dynamic environments like **AWS EKS**, pods are created and destroyed constantly. Prometheus uses **Service Discovery** to automatically find new targets without you having to manually update a config file every time a pod restarts.

### 4. Alertmanager
Prometheus handles the "if/then" logic for alerts (e.g., "If CPU > 90%"), but **Alertmanager** handles the "who/how" (e.g., "Send a Slack message to the SRE team and group 100 alerts into one").

---

## 🏗️ The Pull Model: Why it Wins

Unlike traditional monitoring tools that wait for apps to **Push** data, Prometheus **Pulls** it.

| Feature | Pull Model (Prometheus) | Push Model (Traditional) |
| :--- | :--- | :--- |
| **Control** | Prometheus decides when to scrape (Scrape Interval). | Apps can overwhelm the server during a spike. |
| **Health** | If the pull fails, you know the app is down instantly. | Harder to differentiate between "No traffic" and "App crashed". |
| **Config** | Centralized in one place. | Every app needs to know the server's IP address. |

---

## 📊 PromQL: The Query Language

PromQL allows you to ask complex questions about your data in real-time.

-   **Instant Vector**: Returns a value for a specific point in time.
    -   `http_requests_total`
-   **Range Vector**: Returns a range of values over time.
    -   `http_requests_total[5m]`
-   **Rate Function**: Calculates how fast a counter is increasing.
    -   `rate(http_requests_total[5m])`

---

## 🌟 Real-World Scenarios

### Scenario 1: The "Alert Storm" (Alertmanager)
**Context**: A network switch fails, and suddenly 500 microservices on your EKS cluster report "Connection Refused."
- **Without Alertmanager**: You get 500 emails in 2 seconds. You panic.
- **With Alertmanager**: It **Groups** all 500 alerts into one notification: *"500 Services are down due to Network Failure."* You stay calm and fix the switch.

### Scenario 2: Capacity Planning
**Context**: Your startup is growing. You need to know when you will run out of disk space on your RDS database.
- **Action**: You use the `predict_linear()` function in PromQL:
    - `predict_linear(node_filesystem_free_bytes[1w], 3600 * 24 * 30)`
- **Result**: Prometheus tells you that based on the last week's growth, you will hit 0 bytes in exactly 22 days.

---

## ✅ Best Practices
1.  **Use Labels Wisely**: High cardinality (too many unique labels) can crash your Prometheus server.
2.  **Monitor the Monitor**: Always have a separate Prometheus instance or alerting system monitoring your main Prometheus server.
3.  **Recording Rules**: For complex queries that take a long time to run, use Recording Rules to pre-calculate the results.

---

> "Prometheus doesn't just store data; it gives you the tools to understand the heartbeat of your entire infrastructure."
