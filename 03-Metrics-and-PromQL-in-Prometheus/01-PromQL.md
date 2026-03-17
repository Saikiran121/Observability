# 01 - PromQL: The Brain of Prometheus

**PromQL (Prometheus Query Language)** is a functional query language that lets you select and aggregate time series data in real-time. If Prometheus is the heart that pumps data, PromQL is the brain that makes sense of it.

---

## 💎 The Four Data Types

Every PromQL expression returns one of these four types:

1.  **Instant Vector**: A set of time series containing a single sample for each, all sharing the same timestamp.
    *   *Example*: `http_requests_total`
2.  **Range Vector**: A set of time series containing a range of data points over time.
    *   *Example*: `http_requests_total[5m]`
3.  **Scalar**: A simple numeric floating-point value.
    *   *Example*: `10`
4.  **String**: A simple string (rarely used).

---

## 🎯 Selectors and Matchers

You use "Selectors" to filter data based on its labels.

-   **Equality (`=`)**: `node_cpu_seconds_total{mode="idle"}`
-   **Inequality (`!=`)**: `node_cpu_seconds_total{mode!="idle"}`
-   **Regex Match (`=~`)**: `http_requests_total{handler=~"/api/v1/.*"}`
-   **Regex No-Match (`!~`)**: `http_requests_total{status!~"4.."}`

---

## ⚡ The "Rate" Revolution: `rate()` vs `irate()`

This is the most common point of confusion in PromQL. Both calculate per-second increase, but they do it differently.

### `rate(v range-vector)`
-   **Method**: Calculates the average per-second rate of increase across the *entire* time window.
-   **Best For**: Alerting and long-term trends. It "smooths out" jitter.
-   **Example**: `rate(http_requests_total[5m])`

### `irate(v range-vector)`
-   **Method**: Calculates the "Instantaneous" rate based only on the **last two data points** in the window.
-   **Best For**: High-resolution graphs where you want to see sudden spikes.
-   **Example**: `irate(http_requests_total[1m])`

---

## 🧮 Aggregation Operators

When you have 100 pods, you usually want to see a single "Total" or "Average" line.

-   **`sum()`**: `sum(http_requests_total)` — Total requests across all pods.
-   **`avg()`**: `avg(node_load1)` — Average load across all nodes.
-   **`by` & `without`**: Used to group results.
    *   *Example*: `sum by (status) (rate(http_requests_total[5m]))`
    *   *Result*: Shows total error rate grouped by HTTP status code (200, 404, 500).

---

## 🔮 Advanced: Forecasting with `predict_linear`

PromQL can look into the future! The `predict_linear` function uses a time window to guess what a value will be later.

**Scenario**: You want to know if your disk will be full in 4 hours.
```promql
predict_linear(node_filesystem_free_bytes{job="node"}[1h], 4 * 3600) < 0
```
-   **Meaning**: Look at the last 1 hour of disk usage trend, and tell me if it will be less than 0 (empty) in 4 hours (14,400 seconds).

---

## 🚀 Real-World Scenarios

### Scenario 1: Calculating Percentage Error Rate
You want to know exactly what % of your traffic is failing.
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100
```

### Scenario 2: Detecting CPU Throttling
In Kubernetes, if a pod hits its limit, it gets "throttled." This is bad for performance.
```promql
sum by (pod) (rate(container_cpu_cfs_throttled_seconds_total[5m])) > 0
```

---

## ✅ Best Practices
1.  **Rate First, Sum Second**: Always apply `rate()` to a range vector *before* wrapping it in a `sum()`.
    -   ❌ `rate(sum(metric[5m]))`
    -   ✅ `sum(rate(metric[5m]))`
2.  **Avoid High Resolution on Alerts**: Use `rate()` instead of `irate()` for alerts to avoid "flapping" (on/off alerts).
3.  **Selector Specificity**: The more labels you use in a selector, the faster the query runs.

---

> "PromQL is not just about showing data; it's about asking the right questions to your infrastructure."
