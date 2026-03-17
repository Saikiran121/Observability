# 04 - Installation Guide: Prometheus, Grafana, and Alertmanager

The most efficient way to deploy the full observability stack (Prometheus, Grafana, and Alertmanager) on Kubernetes is using the **kube-prometheus-stack** Helm chart. This stack provides a pre-configured solution with all the necessary exporters and operators.

---

## 🛠️ Installation Steps

### 1. Prerequisites
- A running Kubernetes cluster (e.g., AWS EKS).
- `kubectl` and `helm` installed and configured.

### 2. Install kube-prometheus-stack
First, add the official Prometheus community repository and update your local Helm cache:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 3. Deploy the Chart
Create a dedicated namespace called `monitoring` and deploy the chart using a custom values file:

```bash
# Create the namespace
kubectl create ns monitoring

# Move to your configuration directory (if applicable)
# cd day-2

# Install the chart
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f ./custom_kube_prometheus_stack.yml
```

### 4. Verify the Installation
Check that all pods and services are running correctly:

```bash
kubectl get all -n monitoring
```

---

## 🚀 Accessing the Dashboards

Since the services are internal to the cluster by default, you can use `kubectl port-forward` to access the User Interfaces from your local machine.

### 📊 Prometheus UI
Access the Prometheus query engine and target status:
```bash
kubectl port-forward service/prometheus-operated -n monitoring 9090:9090
```
> [!TIP]
> **Cloud VMs/EC2**: If you are using a remote server, add `--address 0.0.0.0` to the command and access it via `instance-ip:9090`.

### 🎨 Grafana UI
Access dashboards and visualizations:
- **Command**: `kubectl port-forward service/monitoring-grafana -n monitoring 8080:80`
- **Password**: `prom-operator`

### 🔔 Alertmanager UI
Manage and silence alerts:
```bash
kubectl port-forward service/alertmanager-operated -n monitoring 9093:9093
```

---

> [!IMPORTANT]
> Ensure your security groups or firewalls allow traffic on the ports mentioned above if you are accessing them via a public IP.
