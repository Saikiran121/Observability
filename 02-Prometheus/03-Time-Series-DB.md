# 03 - Time Series Database (TSDB): The Engine Under the Hood

A Time Series Database (TSDB) is a database optimized for handling time-stamped data. In Prometheus, the TSDB is the critical component that allows it to ingest millions of samples per second while using very little disk space.

---

## 🆚 TSDB vs. Relational Databases (RDBMS)

Why don't we just use MySQL or PostgreSQL for metrics?

| Feature | Relational (MySQL/Postgres) | Time Series (Prometheus) |
| :--- | :--- | :--- |
| **Data Flow** | High Read/Write balance. | Massive, constant Write-throughput. |
| **Schema** | Rigid (Tables, Rows, Columns). | Flexible (Metric name + Labels). |
| **History** | Deleting data is slow/expensive. | Retention and Compaction are built-in. |
| **Storage** | Row-based (Inefficient for trends). | Columnar/Compressed (Highly efficient). |

---

## 🏗️ Inside the Prometheus TSDB

Prometheus stores metrics in a multi-stage pipeline to ensure data is never lost and remains fast to query.

### 1. The Head Block (In-Memory)
New data is first written to the **Head Block**. 
- It lives in RAM for maximum speed.
- It acts as a "scratchpad" where data is collected before being moved to disk.

### 2. The WAL (Write-Ahead Log)
Because RAM is volatile, Prometheus writes every sample to a **WAL** on the disk *before* putting it in the Head Block.
-   **Scenario**: If your server loses power, Prometheus replays the WAL on restart to recover the last few hours of data that wasn't saved to a block yet.

### 3. Persistent Blocks (On-Disk)
Every few hours (usually 2h), the data in the Head Block is "cut" into a **Block** on disk. A block directory contains:
-   **Chunks**: The compressed raw data points.
-   **Index**: A map that lets Prometheus find your data instantly based on labels.
-   **Meta.json**: Details about the block's time range and statistics.

---

## 🧹 Compaction: Managing the Mess

As time goes on, you end up with hundreds of small 2-hour blocks. This makes queries slow because Prometheus has to open hundreds of files.

**Compaction** is the process where Prometheus:
1.  Takes several small blocks and merges them into one large block.
2.  Deletes redundant data.
3.  Optimizes the index for faster searching.

> [!NOTE]
> Compaction is like the "garbage collection" of the database world—it keeps things tidy and fast.

---

## 🌟 Scenarios & Examples

### Scenario 1: The "Crash & Recover"
**Context**: An EKS node restarts unexpectedly.
- **Problem**: 2 hours of metrics were in the memory (Head Block).
- **TSDB Action**: Prometheus reads the **WAL** segments. It "recharts" every single heartbeat and latency data point that occurred before the crash. 
- **Result**: No data gaps in your Grafana dashboard.

### Scenario 2: Long-term Storage (Retention)
**Context**: You only have 50GB of disk space.
- **Configuration**: You set `--storage.tsdb.retention.size=40GB`.
- **TSDB Action**: When the total size hits 40GB, Prometheus automatically deletes the **oldest persistent blocks**. It keeps your latest data fresh while ensuring the disk never gets full.

---

## ✅ Best Practices
1.  **Fast Disks**: The WAL and Head Block perform heavy I/O. Using SSDs (like AWS EBS gp3) is highly recommended for Prometheus storage.
2.  **Compression**: Prometheus uses "Delta-of-Delta" encoding. This means it only stores the *difference* between two numbers, reducing the size of 16-byte samples to an average of just **1.3 bytes per sample**. 
3.  **Avoid Churn**: Constantly changing labels creates small, fragmented chunks that make compaction work harder.

---

> "A TSDB doesn't just store numbers; it stores the history of your infrastructure in a way that remains searchable 100 days from now."
