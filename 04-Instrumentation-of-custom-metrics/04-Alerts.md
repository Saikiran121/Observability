# Alerts In-Depth Guide

Alerting in a Prometheus-monitored environment is a two-step process:
1.  **Prometheus** detects the condition (based on rules) and sends an "alert" to Alertmanager.
2.  **Alertmanager** receives the alert, groups it, inhibits redundant alerts, and routes it to a receiver (like Email, Slack, or PagerDuty).

---

## 1. The Alerting Pipeline

The system uses three main components to ensure you get notified when something goes wrong:

### A. The Alert Definition (`PrometheusRule`)
This file defines **what** constitutes an incident. It uses PromQL (Prometheus Query Language) to constantly evaluate the state of your cluster.

**File**: `prometheus-rules.yaml`

**Key Fields**:
- `alert`: The name of the alert (e.g., `PodRestart`).
- `expr`: The condition. If this query returns any data, the alert is triggered.
- `for`: How long the condition must persist before the alert transitions from `Pending` to `Firing`.
- `labels`: Metadata to categorize the alert (e.g., `severity: critical`).

### B. The Routing & Receiver (`AlertmanagerConfig`)
This file defines **how** and **where** to send the notification once an alert is firing.

**File**: `alertmangerconfig.yaml`

**Key Fields**:
- `route`: Defines the logic for matching alerts to receivers.
- `receivers`: Defines the actual destination (e.g., an email address or a webhook).
- `repeatInterval`: How long to wait before re-sending the same alert if it's still firing.

### C. Sensitive Credentials (`Secret`)
Sensitive information like SMTP passwords or API tokens should **never** be hardcoded in your configuration files. Kubernetes Secrets store this data securely.

**File**: `email-secrets.yaml`

---

## 2. Why We Need These Files (The "Why")

| File | Why we need it |
| :--- | :--- |
| **`prometheus-rules.yaml`** | Without rules, Prometheus is just a database of numbers. Rules turn those numbers into actionable insights (e.g., "Our server crashed!"). |
| **`alertmangerconfig.yaml`** | Prometheus itself doesn't know how to send emails. It only knows how to "yell" at Alertmanager. This file tells Alertmanager who to email. |
| **`email-secrets.yaml`** | To send an email, Alertmanager needs your Gmail password. This file keeps that password safe and accessible only to the Alertmanager process. |

---

## 3. Real-World Scenarios & Examples

### Scenario 1: Preventing "Alert Fatigue"
If a server restarts 10 times in a minute, you don't want 10 emails.
- **Solution**: Use `repeatInterval` (e.g., `30m`) in `AlertmanagerConfig`. Alertmanager will group those restarts and send one email every 30 minutes until the issue is fixed.

### Scenario 2: Critical vs. Warning
You want to be paged for a crash, but only emailed for high CPU.
- **Solution**: Use `labels` in `PrometheusRule`.
    - `PodRestart` -> `severity: critical` -> Page the engineer.
    - `HighCpuUsage` -> `severity: warning` -> Send a routine email.

### Scenario 3: Healthy vs. Unhealthy
You want to know when a problem is solved.
- **Solution**: Set `sendResolved: true` in your `emailConfigs`. Alertmanager will send a follow-up email when the condition in your `PrometheusRule` is no longer true.

---

## 4. Example Rule: PodRestart
```yaml
- alert: PodRestart
  expr: changes(kube_pod_container_status_restarts_total[5m]) > 0
  labels:
    severity: critical
  annotations:
    summary: "Pod {{ $labels.pod }} restarted"
```
- **The Condition**: `changes(...[5m]) > 0` looks at the restart counter. If it has increased at all in the last 5 minutes, trigger the alert.
- **The Summary**: Uses templates to automatically include the name of the specific pod that crashed in your email subject line.
