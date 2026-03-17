# Understanding Prometheus Metric Types

In Prometheus, every metric has a specific type that defines how it is collected and processed. Choosing the right metric type is crucial for effective monitoring and alerting.

---

## 1. Counter
A **Counter** is a cumulative metric that represents a single monotonically increasing counter whose value can only increase or be reset to zero on restart.

### Key Characteristics
- **Always Increasing**: The value never goes down (except on system restarts).
- **Used for Rates**: Mostly used with the `rate()` or `irate()` functions in PromQL to calculate how fast a value is increasing.

### Real-World Scenarios
- **HTTP Requests**: Total number of requests handled by a service.
- **E-commerce User Events**: Tracking how many users have **registered** or **logged in** to your application. Since these are cumulative events (the total number of registrations only goes up), a Counter is the perfect fit.
- **Error Tracking**: Total number of 5xx errors or exceptions encountered.
- **Task Completions**: Number of background jobs or scheduled tasks finished.

### Example
```prometheus
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="post", code="200"} 1027

# HELP user_registrations_total Total number of user sign-ups.
# TYPE user_registrations_total counter
user_registrations_total 5420

# HELP user_logins_total Total number of user logins.
# TYPE user_logins_total counter
user_logins_total 12840
```

---

## 2. Gauge
A **Gauge** is a metric that represents a single numerical value that can arbitrarily go up and down.

### Key Characteristics
- **Snapshot Value**: Represents the state of something at a specific point in time.
- **Bi-directional**: Can increase or decrease.

### Real-World Scenarios
- **Resource Usage**: Memory usage, CPU temperature, disk space.
- **Concurrent Activity**: Number of active sessions, current queue size.
- **Status Codes**: 1 for Up, 0 for Down.

### Example
```prometheus
# HELP node_memory_usage_bytes Current memory usage in bytes.
# TYPE node_memory_usage_bytes gauge
node_memory_usage_bytes 4294967296

# HELP active_users Current number of active users.
# TYPE active_users gauge
active_users 150
```

---

## 3. Histogram
A **Histogram** samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.

### Key Characteristics
- **Bucket-based**: You define "buckets" (e.g., 100ms, 250ms, 500ms) and Prometheus counts how many events fall into each.
- **Cumulative Buckets**: A bucket for 500ms also includes all events that were less than 250ms.
- **Aggregatable**: Can be aggregated across multiple instances.

### Real-World Scenarios (The "Pizza Delivery" Analogy)
To understand buckets, think of a pizza delivery service tracking delivery times:
- **Bucket 1 (le="15m")**: Deliveries that arrived in 15 minutes or less.
- **Bucket 2 (le="30m")**: Deliveries that arrived in 30 minutes or less (this *includes* the 15m ones).
- **Bucket 3 (le="60m")**: Deliveries that arrived in an hour or less.
- **Bucket 4 (le="+Inf")**: All deliveries (even the ones that took 2 hours).

By looking at these buckets, you can quickly say: "We delivered 80% of our pizzas in under 30 minutes."

**Use cases**:
- **API Latency**: How many requests are served under 100ms vs. how many take longer than 1s?
- **Response Sizes**: How many responses are small (under 1KB) vs. large (over 10MB)?

### Example
```prometheus
# HELP pizza_delivery_seconds Time taken to deliver pizza.
# TYPE pizza_delivery_seconds histogram
pizza_delivery_seconds_bucket{le="900"} 12     # 15 mins
pizza_delivery_seconds_bucket{le="1800"} 45    # 30 mins
pizza_delivery_seconds_bucket{le="3600"} 58    # 60 mins
pizza_delivery_seconds_bucket{le="+Inf"} 60    # Total deliveries
pizza_delivery_seconds_sum 84500               # Sum of all delivery times
pizza_delivery_seconds_count 60                # Total count
```

---

## 4. Summary
A **Summary** is similar to a histogram, but it calculates configurable quantiles (like p50, p90, p99) over a sliding time window directly on the application side.

### Key Characteristics
- **Client-side Quantiles**: The application does the math, not Prometheus.
- **No Buckets Needed**: Easier to set up if you just want specific percentiles.
- **Not Aggregatable**: You cannot accurately average quantiles from two different servers.

### Real-World Scenarios
- **Accurate Percentiles**: When you need exact p99 latency without worrying about choosing bucket sizes.
- **Performance Critical Paths**: Where you need to know the tail latency accurately.

### Example
```prometheus
# HELP http_request_duration_seconds_summary Latency percentiles.
# TYPE http_request_duration_seconds_summary summary
http_request_duration_seconds_summary{quantile="0.5"} 0.15
http_request_duration_seconds_summary{quantile="0.9"} 0.45
http_request_duration_seconds_summary{quantile="0.99"} 0.98
http_request_duration_seconds_summary_sum 124.2
http_request_duration_seconds_summary_count 1000
```

---

## Comparison Summary

| Metric Type | Can go down? | Aggregatable? | Best Use Case |
| :--- | :--- | :--- | :--- |
| **Counter** | No | Yes | Rates, totals, increments |
| **Gauge** | Yes | Yes (Average) | Current state, snapshots |
| **Histogram** | N/A | Yes | Latency/Size distribution over time |
| **Summary** | N/A | No | Accurate client-side quantiles |
