<div align="center">
  <h1>🚀 phib.net Core Infrastructure</h1>
  <p><strong>Enterprise Cloud Architecture & B2B Managed SaaS Portal</strong></p>
  <p><i>Declarative Kubernetes manifests, High-Availability Ingress, and Interactive Terminal Simulations.</i></p>
</div>

---

## ⚡ Overview
This repository contains the source code, infrastructure blueprints, and container configurations for **[phib.net](https://phib.net)**. 

Far beyond a standard static site, this platform acts as an automated **B2B SaaS Sales Funnel**. It leverages dynamic, interactive terminal simulations of live infrastructure deployments (ERPNext, Directus, Vaultwarden, Uptime Kuma) and securely routes enterprise leads directly into a Managed SaaS pipeline.

## 🛠️ Tech Stack & Architecture
- **Frontend Engine:** Matrix-themed, ultra-lightweight Vanilla JS with GPU-accelerated micro-animations.
- **Containerization:** Multi-stage Docker builds orchestrating highly optimized `nginx:alpine` images.
- **Orchestration:** Deployed dynamically on a resilient, bare-metal local Kubernetes cluster.
- **Edge Networking:** Securely tunneled to the public internet via **Cloudflare Zero-Trust Tunnels** bypassing NAT limitations.
- **CI/CD:** Fully automated GitHub Actions pipeline (builds, lints, and pushes to Docker Hub on every commit).

## 🚀 Key Features
- **Live Terminal Simulations:** Custom JS engine simulating real-time CLI diagnostics for Kubernetes namespaces.
- **Multi-Tenant Gateway Integration:** Interfaces with the backend Flask API (`saas-launchpad`) for provisioning client tenants.
- **Hardened Security:** Strictly enforced CORS, Cloudflare WAF rules, and NGINX security headers.
- **Real-Time Telemetry:** Backend API integration for live Redis-backed visitor counters.

## ⚙️ Kubernetes Deployment
The platform is designed to be immutable and instantly scalable. 
```bash
# 1. Build the lightweight NGINX container
docker build -t phib256/portfolio-website:latest .

# 2. Deploy declarative configuration to the local K8s cluster
kubectl apply -f k8s-manifests.yaml

# 3. Force Zero-Downtime Rollout
kubectl rollout restart deployment/portfolio-website
```

## 🔒 License & Usage
This is the proprietary infrastructure code for [phib.net](https://phib.net). 
For business inquiries, SaaS hosting, or Enterprise Cloud Consulting, please initiate a handshake via the portal or reach out on LinkedIn.
