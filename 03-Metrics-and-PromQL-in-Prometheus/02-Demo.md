# 02 - Demo: Monitoring a Crashing Pod with PromQL

In this demo, we will intentionally "break" a pod to see how Prometheus tracks system failures using standard metrics.

---

## 🧪 The Experiment: Creating a CrashLoop

We will deploy a pod that is designed to fail immediately. Kubernetes will try to restart it, creating a "CrashLoopBackOff" scenario.

### 1. Deploy the Crashing Pod
Run this command on your cluster:
```bash
kubectl run busybox-crash --image=busybox -- /bin/sh -c "exit 1"
```
*This command starts a container that immediately runs `exit 1` (an error code), causing the pod to crash.*

### 2. Wait for Data
Wait for about **5 minutes**. Kubernetes will attempt to restart the container multiple times, and `kube-state-metrics` will report these restarts to Prometheus.

---

## 🔍 The Query: Hunting for Restarts

Now, go to your Prometheus UI and run the following query:

```promql
kube_pod_container_status_restarts_total{namespace="default"}
```

---

## 📖 Deep Dive: How the Query Works

Let's break down this query piece by piece to understand what is happening under the hood.

### 1. The Metric: `kube_pod_container_status_restarts_total`
- **Source**: This metric is provided by **kube-state-metrics**.
- **Meaning**: It is a core Kubernetes metric that tracks the cumulative number of times a specific container has restarted.
- **Metric Type**: It is a **Counter**. This means it only goes up. Every time the pod crashes and restarts, this number increments (+1).

### 2. The Filter: `{namespace="default"}`
- **Usage**: We use label matching to narrow down our search. Instead of looking at every pod in the entire cluster (which could be hundreds), we are only looking at pods in the `default` namespace.
- **Dimensionality**: If you wanted to see restarts for a specific pod name, you could use:
  `{pod="busybox-crash"}`

### 3. The Logic: Why 5 Minutes?
Prometheus scrapes data at intervals (e.g., every 30 seconds). By waiting 5 minutes, we allow enough time for:
1.  The pod to crash multiple times.
2.  Prometheus to perform multiple "scrapes" to capture the increasing counter value.
3.  The Time Series Database (TSDB) to index the data for our query.

---

## 🌟 Why this matters in Production

In a real-world E-commerce app, a pod might crash due to:
- **OOM Kill**: Out of memory.
- **Liveness Probe Failure**: The app is "stuck" but the container is still running.
- **Code Bug**: A specific request crashes the process.

By monitoring `restarts_total`, you can set up an **Alert** that triggers if any pod restarts more than 3 times in a 10-minute window. This allows you to catch "silent" failures before your users notice a slow website.

---

> [!TIP]
> If you want to see the *rate* of restarts (how fast it is crashing), you can wrap the query in the `rate` function:
> `rate(kube_pod_container_status_restarts_total[5m])`