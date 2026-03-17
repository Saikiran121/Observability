# 02 - Metrics: The Pulse of your System

Metrics are the most fundamental pillar of observability. They provide a numerical representation of data measured over intervals of time, allowing you to track trends, trigger alerts, and understand the health of your infrastructure at a glance.

---

## 📊 Core Metric Types

Modern monitoring systems (like Prometheus) categorize metrics into four primary types. Choosing the right one is critical for accurate analysis.

### 1. Counter
A **Counter** is a cumulative metric that represent a single monotonically increasing value. It can only go up or reset to zero on restart.
- **What it tracks**: Events that you want to count over time.
- **Example**: `http_requests_total`, `errors_total`, `completed_tasks_total`.
- **Querying**: Never use the raw value. Use `rate()` to see how fast it's growing (e.g., "Requests per second").

### 2. Gauge
A **Gauge** represents a single numerical value that can arbitrarily go up and down.
- **What it tracks**: Snapshots of the current state.
- **Example**: `memory_usage_bytes`, `cpu_temperature`, `active_user_sessions`, `queue_depth`.
- **Querying**: Use functions like `avg_over_time()` or `max_over_time()`.

### 3. Histogram
A **Histogram** samples observations (like request durations) and counts them in configurable buckets. It also provides a sum of all observed values and a total count.
- **What it tracks**: Distribution of values (Latencies, Payload sizes).
- **Example**: `http_request_duration_seconds_bucket`.
- **Power**: Allows you to calculate **Percentiles** (P99, P95) at query time.

### 4. Summary
Similar to histograms, a **Summary** tracks the distribution of observations. However, it calculates quantiles on the **client-side** over a sliding window.
- **Pros**: Provides exact percentiles without complex queries.
- **Cons**: Cannot be aggregated across multiple instances of a service.
- **Use Case**: When high precision is needed for a single instance and query performance is a concern.

---

## 🕳️ The Trap: High Cardinality

**Cardinality** refers to the number of unique values in a dataset. In metrics, this happens when you use labels.

- **Low Cardinality**: `region` (US-East, US-West, EU-Central) — *Good.*
- **High Cardinality**: `user_id`, `email`, `request_id` — *Dangerous.*

> [!WARNING]
> Including a `user_id` as a label in a metric can create millions of unique time series, causing your Prometheus or Grafana instance to crash due to memory exhaustion (Cardinality Explosion).

---

## 🌟 Scenarios & Examples

### Scenario 1: Identifying a "Slow Leak" (Gauges)
**Context**: You have a background worker processing jobs from a queue.
- **Metrics**: Track `queue_depth` (Gauge).
- **Behavior**: If `queue_depth` keeps rising even though your `cpu_usage` is low, you know your workers are blocked or bottlenecked, not just overworked.

### Scenario 2: Guaranteeing SLA (Histograms)
**Context**: Your contract says 99% of requests must be faster than 200ms.
- **Metrics**: Track `http_request_duration_seconds_bucket`.
- **Action**: Use `histogram_quantile(0.99, ...)` in your alerting engine. Even if the average latency is 50ms, the P99 might be 500ms, revealing that 1% of your customers are having a terrible experience.

---

## ⏳ Historical Data & Storage

One of the most powerful features of metrics is the ability to look back in time. This is made possible by **Time Series Databases (TSDB)** like Prometheus, InfluxDB, or M3DB.

### 1. Retention Policies
Metrics aren't stored forever for free. You must define a **Retention Period** (e.g., 15 days, 3 months). 
- **Short-term**: High granularity (e.g., 10-second scrapes) for immediate troubleshooting.
- **Long-term**: Aggregated data for capacity planning and year-over-year trends.

### 2. Aggregation & Downsampling
As data gets older, you don't need second-by-second precision. Systems often **downsample** data:
- **Raw Data**: 1 data point every 10 seconds.
- **After 30 days**: 1 data point every 1 hour (average/max).
This saves massive amounts of storage space while keeping historical trends visible.

### 3. Why Historical Data Matters
- **Seasonality**: Understanding that "high CPU on Monday mornings" is normal behavior.
- **Post-Mortems**: Analyzing what happened 3 hours ago during an outage.
- **Capacity Planning**: Predicting when you will run out of disk space based on the last 6 months of growth.

---

## ✅ Best Practices
1. **Naming**: Use base units and suffixes.
    - Bad: `req_count` | Good: `http_requests_total`
    - Bad: `mem_used` | Good: `memory_usage_bytes`
2. **Standard Units**: Always use seconds for time, bytes for memory. Don't mix milliseconds and seconds in the same dashboard.
3. **Consistency**: Use the same labels (e.g., `service_name`, `env`) across all metrics to allow for easy cross-referencing.

---

> "Metrics tell you *what* is happening. They are the 'check engine' light of your distributed system."
