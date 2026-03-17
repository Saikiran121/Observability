# 07 - kube-state-metrics: The Cluster's Librarian

While **Node Exporter** looks at the hardware (CPU, RAM, Disk), and **Metrics Server** helps with autoscaling, **kube-state-metrics (KSM)** focuses on the **objects** inside Kubernetes. It cares about the *state* of your deployments, pods, and nodes as defined in the Kubernetes API.

---

## 🏗️ Architecture: How it Works

KSM is an add-on service that listens to the Kubernetes API server.

1.  **API Querying**: It constantly asks the API: "How many replicas should this deployment have? What is the status of this Pod?"
2.  **Snapshotting**: It creates an in-memory snapshot of these objects.
3.  **Formatting**: It converts these technical API objects into Prometheus metrics.
4.  **Exposition**: It serves these metrics on a `/metrics` endpoint (usually port 8080).

---

## 🆚 The Great Comparison

It is easy to get confused between these three tools. Here is the breakdown:

| Feature | Node Exporter | Metrics Server | kube-state-metrics |
| :--- | :--- | :--- | :--- |
| **Primary Goal** | Monitor the **Host/OS**. | Power the **Autoscaler (HPA)**. | Monitor **K8s Object States**. |
| **Source** | `/proc`, `/sys`. | Kubelet. | Kubernetes API Server. |
| **Data Type** | CPU, Mem, Disk, Net. | Aggregated CPU/Mem usage. | Metadata, Counts, Phases. |
| **Example** | `node_cpu_seconds_total` | `pod_cpu_utilization` | `kube_pod_status_phase` |

---

## 📈 Key Metrics & Examples

KSM provides "metadata" metrics that are essential for high-level alerting.

-   **`kube_pod_status_phase`**: Tells you if a pod is `Running`, `Pending`, or `Failed`.
-   **`kube_deployment_status_replicas_unavailable`**: Tells you if your app's rollout is stuck or failing.
-   **`kube_node_status_condition`**: Tells you if a node is reporting `DiskPressure` or `Ready=False`.
-   **`kube_job_status_succeeded`**: Tells you if a backup or batch job finished correctly.

---

## 🌟 Real-World Scenarios

### Scenario 1: The Stuck Rollout
**Problem**: You update your E-commerce app to version 2.0. You see that some users still see the old version, and the new pods aren't starting.
- **KSM Action**: You query `kube_deployment_status_replicas_unavailable`.
- **Diagnosis**: You see the value is `3`. 
- **Result**: You discover that the new version has a "Pending" status because there are no available nodes with enough memory. KSM flagged the *availability gap* that resource metrics might have missed.

### Scenario 2: Persistent Volume Exhaustion
**Problem**: Your database pods suddenly stop working.
- **KSM Action**: You query `kube_persistentvolumeclaim_status_phase`.
- **Diagnosis**: You see several PVCs are in the `Lost` state.
- **Result**: You realize that the underlying AWS EBS volumes were deleted or detached. KSM tracked the *state of the resource*, not just its usage.

---

## ✅ Best Practices
1.  **Resource Limits**: In large clusters with thousands of pods, KSM can consume significant memory. Always set resource requests/limits for the KSM pod.
2.  **Sharding**: If your cluster is massive (10k+ pods), you can "shard" KSM to spread the load across multiple instances.
3.  **Filtering**: Use the `--resources` flag to tell KSM to only monitor what you need (e.g., skip monitoring `Endpoints` or `Secrets` to save Prometheus memory).

---

> "Metrics Server tells you if the engine is hot; Node Exporter tells you if the tires are flat; but kube-state-metrics tells you if the car is even on the road."
