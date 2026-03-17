# 03 - Logs: The Narrative of your System

Logs are timestamped, immutable records of discrete events. If Metrics are the "check engine" light, Logs are the detailed diagnostic report that tells you exactly what the engine was doing when the light came on.

---

## 🏗️ Structured vs. Unstructured Logging

The way you format your logs determines how useful they are when a crisis hits.

### 1. Unstructured Logging (Plain Text)
Traditional logs are often just strings of text aimed at human readers.
- **Example**: `User saikiran logged in at 12:45 PM from IP 192.168.1.1`
- **Problem**: Hard for machines to parse. Searching for "all logins from a specific IP" requires complex regex that breaks if the developer changes "at" to "@".

### 2. Structured Logging (JSON)
Structured logging treats logs as **data**, typically formatted as JSON key-value pairs.
- **Example**: 
```json
{
  "timestamp": "2026-03-17T12:45:00Z",
  "level": "INFO",
  "event": "user_login",
  "user": "saikiran",
  "ip": "192.168.1.1",
  "service": "auth-service"
}
```
- **Benefit**: Machines can index these fields instantly. You can query `event="user_login" AND ip="192.168.1.1"` without regex.

---

## 🚦 Logging Levels (Severity)

Log levels allow you to filter noise and prioritize critical issues.

| Level | Purpose | Example |
| :--- | :--- | :--- |
| **DEBUG** | Fine-grained info for developers. | `Entering function calculateTax()` |
| **INFO** | Significant business/state events. | `Order #12345 processed successfully.` |
| **WARN** | Something unexpected but not fatal. | `Database connection retried (attempt 2).` |
| **ERROR** | Functionality failed; needs attention. | `Failed to upload profile picture: S3 Timeout.` |
| **FATAL** | Entire process/app crashed. | `Out of Memory: Killing process.` |

> [!TIP]
> **Production Rule**: Usually, only `INFO` and above are logged in production to save costs and performance. `DEBUG` is reserved for development or local troubleshooting.

---

## 🕸️ Centralized Logging Architecture

In a microservices world, logs are scattered across dozens of containers. You cannot SSH into each one to view logs. You need a **Log Pipeline**:

1.  **Collection**: Agents (like Fluentbit or Filebeat) gather logs from files or stdout.
2.  **Processing**: Enriching logs with metadata (e.g., `hostname`, `env`, `version`).
3.  **Storage**: A searchable database like **Elasticsearch** or **Loki**.
4.  **Visualization**: A dashboard like **Kibana** or **Grafana** to search and graph logs.

---

## 🌟 Scenarios & Examples

### Scenario 1: The "Silent Failure"
**Context**: A user reports that they clicked "Save" but their data didn't update. No error was shown on the UI.
- **Metrics** show 100% success rate (the API returned 200 OK).
- **Logs**: You search the `trace_id` and find a `WARN` message: `Validation failed for field 'zip_code', defaulting to null.`
- **Lesson**: Logs caught the "soft error" that sensors (metrics) missed.

### Scenario 2: Security Forensics
**Context**: An unusual spike in traffic is detected.
- **Centralized Logs**: You query for the top 10 IP addresses with the most `403 Forbidden` errors in the last 10 minutes.
- **Action**: You identify a brute-force attack and block the offending IPs at the firewall.

---

## ✅ Best Practices
1.  **Context is King**: Always include a `trace_id` or `request_id` to link logs to a specific user journey.
2.  **No PII**: Never log passwords, credit card numbers, or sensitive personal data.
3.  **Asynchronous Logging**: Use a logging library that doesn't block your main application thread while writing to disk or network.
4.  **Don't Log Everything**: Too much data creates "noise" and increases storage costs. Log what is *actionable*.

---

> "Metrics tell you *that* you have a problem. Logs show you *exactly* what that problem looks like."
