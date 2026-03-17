# 03 - Demo: Creating a Grafana Dashboard for Pod Restarts

Visualizing pod restarts in a dashboard is much more effective than running manual queries. It allows your team to see patterns and spikes in failures at a glance.

---

## 🎯 Objective
Create a dedicated Grafana panel that tracks the total number of container restarts across your Kubernetes cluster.

---

## 🛠️ Step-by-Step Guide

### Step 1: Navigate to Dashboards
1.  Login to your Grafana instance.
2.  In the left-hand sidebar, click on the **Dashboards** icon (four squares).
3.  Click the **New** button in the top-right corner and select **New Dashboard**.

### Step 2: Add Visualization
1.  In the new dashboard, click the **+ Add visualization** button.
2.  **Select Data Source**: From the list that appears, select your **Prometheus** data source.

### Step 3: Configure the Query
1.  In the query editor (usually at the bottom), locate the **Metrics browser** or the direct input field.
2.  Enter the following PromQL query:
    ```promql
    kube_pod_container_status_restarts_total
    ```
3.  *(Optional)* To make the graph cleaner, you can group by pod name:
    ```promql
    sum by (pod) (kube_pod_container_status_restarts_total)
    ```
4.  Press **Shift + Enter** or click **Run queries**.

### Step 4: Panel Customization
On the right-hand panel, you can style your visualization:
-   **Title**: Set it to "Pod Restarts (Total)".
-   **Description**: "Tracks cumulative container restarts via kube-state-metrics."
-   **Visualization Type**: Under "Suggestions," select **Time series** or **Bar gauge**.
-   **Legend**: Set the legend mode to "Table" to see the pod names clearly.

### Step 5: Save the Dashboard
1.  Click the **Save** icon in the top-right corner.
2.  Give your dashboard a name, such as **"K8S Cluster Health"**.
3.  Click **Save**.

---

## 💡 Understanding the Result

Once saved, this panel will update in real-time.

-   **Flat Line**: This is what you want! It means no restarts are happening.
-   **Stepping Line**: An upward "staircase" pattern indicates that a pod is crashing and restarting repeatedly (CrashLoopBackOff).
-   **Sudden Vertical Jump**: Indicates a one-time failure followed by a recovery.

> [!IMPORTANT]
> Because `restarts_total` is a **Counter**, the graph shows the *cumulative* count. If you want to see "Restarts per minute," use the `increase` function in your query: 
> `sum by (pod) (increase(kube_pod_container_status_restarts_total[1m]))`

---

> "A dashboard isn't just a graph; it's a notification system for your eyes. Seeing a spike early can save hours of downtime later."
