# 05 - Demo: Connecting Prometheus and Grafana

Once you have installed the Prometheus stack using Helm, the next step is to connect Grafana to Prometheus so you can start visualizing your metrics.

---

## 🎨 Step 1: Login to Grafana

1.  **Expose the UI**: If you haven't already, run the port-forward command:
    ```bash
    kubectl port-forward service/monitoring-grafana -n monitoring 8080:80
    ```
2.  **Access**: Open your browser and go to `http://localhost:8080`.
3.  **Credentials**: 
    - **User**: `admin`
    - **Password**: `prom-operator` (as per the default kube-prometheus-stack installation).

---

## 🔗 Step 2: Add Prometheus as a Data Source

To visualize metrics, Grafana needs to "talk" to Prometheus.

1.  **Navigate**: In the left-hand sidebar, click on **Connections** (icon looks like a plug).
2.  **Add Connection**: Click on **Add new connection**.
3.  **Search**: Type `Prometheus` in the search bar and select the Prometheus tile.
4.  **Configure**:
    - **Name**: `Prometheus` (or any descriptive name).
    - **URL**: You need the internal Kubernetes DNS name of the Prometheus service. Usually, it is:
      `http://prometheus-operated.monitoring.svc.cluster.local:9090`
      *(If you are running everything locally/simple, `http://prometheus-operated:9090` might also work depending on your namespace).*
5.  **Save & Test**: Scroll to the bottom and click **Save & test**. 
    - ✅ If successful, you will see a green banner: "Data source is working".

---

## 📊 Step 3: Explore the Data

1.  Click on the **Explore** icon (compass) in the sidebar.
2.  Select your newly added **Prometheus** data source.
3.  In the query field, type a simple metric like `up` or `node_memory_MemFree_bytes` and click **Run query**.
4.  You should now see a graph appearing!

---

> [!TIP]
> **Pre-built Dashboards**: One of the best parts about `kube-prometheus-stack` is that it often comes with pre-installed dashboards. Check the **Dashboards** menu to see your cluster's health immediately!
