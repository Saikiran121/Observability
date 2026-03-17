# 05 - Metric Aggregation: Making Sense of Crowds

Prometheus often collects thousands of time series for a single metric (e.g., one for every pod). **Aggregation** is the process of combining these multiple streams into a single, meaningful value that represents the state of a service or a cluster.

---

## ⚙️ Aggregation & Functions in PromQL

Aggregation in PromQL allows you to combine multiple time series into a single one, based on certain labels.

### 1. Core Aggregation Operators

| Operator | Usage | Real-World Meaning |
| :--- | :--- | :--- |
| **`sum()`** | `sum(http_requests_total)` | "How many total requests did the entire app serve?" |
| **`avg()`** | `avg(node_cpu_seconds_total)` | "What is the average CPU load across the cluster?" |
| **`min()` / `max()` | `max(container_memory_usage_bytes)` | "Is any single pod about to run out of memory?" |
| **`count()`** | `count(up == 1)` | "How many instances of my service are actually running?" |

#### 🚀 Practical Examples:
- **Sum Up All CPU Usage**:
  `sum(rate(node_cpu_seconds_total[5m]))`
  *This query aggregates the CPU usage across all nodes.*
- **Average Memory Usage per Namespace**:
  `avg(container_memory_usage_bytes) by (namespace)`
  *This query provides the average memory usage grouped by namespace.*

---

## 🛠️ Key Prometheus Functions

Functions are used to transform range vectors into instant vectors or provide advanced analysis.

### 1. The `rate()` Function
Calculates the per-second average rate of increase of the time series in a specified range.
- **Example**: `rate(container_cpu_usage_seconds_total[5m])`
- **Use Case**: This calculates the rate of CPU usage over 5 minutes. Use this for counters that record cumulative totals.

### 2. The `increase()` Function
Returns the increase in a counter over a specified time range.
- **Example**: `increase(kube_pod_container_status_restarts_total[1h])`
- **Use Case**: This gives the total increase in container restarts over the last hour. Highly readable for humans.

### 3. The `histogram_quantile()` Function
Calculates quantiles (e.g., 95th percentile) from histogram data.
- **Example**: `histogram_quantile(0.95, sum(rate(apiserver_request_duration_seconds_bucket[5m])) by (le))`
- **Use Case**: This calculates the 95th percentile of Kubernetes API request durations. Essential for tracking Latency SLAs.

---

## 🎯 Dimensionality Control: `by` vs `without`

Aggregating data usually removes all labels. To keep specific information, we use these clauses.

### 1. The `by` Clause (Keep these)
Explicitly lists the labels you want to keep. Everything else is dropped.
- **Query**: `sum by (status) (rate(http_requests_total[5m]))`
- **Result**: You get a total for "200", "404", and "500".

### 2. The `without` Clause (Drop these)
Lists the labels you want to aggregate away, keeping everything else.
- **Query**: `sum without (pod, instance) (rate(http_requests_total[5m]))`

---

## ✅ Best Practices: The "Rate First" Rule

-   ❌ **Incorrect**: `rate(sum(metric_total[5m]))`
-   ✅ **Correct**: `sum(rate(metric_total[5m]))`

---

> "Raw data is a noise. Aggregation is the volume knob that lets you turn down the distraction and hear the signal."
