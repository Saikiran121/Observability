# 06 - Node Exporter: The System's Vital Sensor

The **Node Exporter** is a Prometheus exporter for hardware and OS metrics exposed by Unix kernels (Linux/BSD/Solaris). It is the standard tool for monitoring server health and performance.

---

## 🏗️ Architecture: How it Works

Node Exporter is a simple, stateless binary that runs on your servers (or nodes).

1.  **Metric Retrieval**: It reads the `/proc`, `/sys`, and other system directories to get raw data from the Linux kernel.
2.  **Formatting**: It translates that data into the Prometheus "Text Exposition" format.
3.  **Exposition**: It serves these metrics on a web endpoint, usually `http://<node-ip>:9100/metrics`.
4.  **Prometheus Scraping**: Prometheus periodically fetches (scrapes) these metrics.

> [!NOTE]
> Unlike an agent that "pushes" data, Node Exporter just sits there and waits for Prometheus to ask for it. This makes it extremely lightweight.

---

## 🧩 Collectors: The Building Blocks

Node Exporter is modular. It uses "Collectors" to gather specific data.

-   **Enabled by Default**: CPU, Memory, Disk, Network, Filesystem.
-   **Optional Collectors**: 
    -   `systemd`: Monitors service status.
    -   `processes`: Counts the types of processes running.
    -   `thermal`: Monitors temperature sensors.

### 🛠️ Controlling Collectors
You can enable/disable collectors using flags at startup:
```bash
# Example: Disable the 'wifi' collector and enable 'systemd'
./node_exporter --no-collector.wifi --collector.systemd
```

---

## 📈 Key Metrics & Units

When you query Node Exporter, you'll see metrics like these:

| Metric Name | Unit | Meaning |
| :--- | :--- | :--- |
| `node_cpu_seconds_total` | Seconds | How long the CPU has been busy (Counter). |
| `node_memory_MemAvailable_bytes`| Bytes | How much memory is ready for use (Gauge). |
| `node_filesystem_avail_bytes` | Bytes | Free space remaining on a disk (Gauge). |
| `node_load1` | Ratio | The 1-minute system load average. |

---

## 📝 The Textfile Collector: Custom Metrics

One of the most powerful features is the **Textfile Collector**. It allows Node Exporter to ingest metrics from static files on the disk.

**Use Case**: You have a cron job that runs a database backup. You want to know if it finished successfully.
1.  Your script runs and writes `backup_success 1` to a file.
2.  Node Exporter reads `/var/lib/node_exporter/backup.prom` and serves it to Prometheus.

> [!IMPORTANT]
> **Atomic Writes**: Always write to a temporary file first and then `mv` it to the final `.prom` file. This prevents Prometheus from reading a half-written, corrupted file!

---

## 🌟 Real-World Scenarios

### Scenario 1: The "Silent" Slow Disk
**Problem**: Your E-commerce app's checkout is slow, but the application logs show no errors.
- **Node Exporter Action**: You look at `node_disk_io_time_seconds_total`.
- **Diagnosis**: You see the "I/O Wait" metric is spiking to 80%.
- **Result**: You discover a failing SSD on the worker node. Node Exporter caught what the app missed.

### Scenario 2: Resource Crashing (OOM)
**Problem**: Your main website pod keeps restarting on EKS.
- **Node Exporter Action**: You look at `node_memory_Active_bytes` on the specific Node where the pod was running.
- **Diagnosis**: You see the node memory hit 99% right before the restart.
- **Result**: You realize the pod didn't have a "Memory Limit" set, and it consumed all the node's memory until the Linux kernel killed it (Out of Memory).

---

## ✅ Best Practices
1.  **Least Privilege**: Don't run Node Exporter as `root` unless absolutely necessary (some hardware collectors might need it).
2.  **Filter Metrics**: If you have thousands of nodes, don't collect everything. Disable collectors you don't use to save storage space.
3.  **Security**: Restrict access to port `9100` so only your Prometheus server can scrape it.

---

> "Node Exporter is the eyes and ears of your server. It turns raw hardware signals into actionable intelligence."
