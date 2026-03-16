# ResQNet - Disaster Response Platform

A real-time disaster response web application with full DevOps pipeline.

## Pipeline Flow

```
Git Push → GitHub Actions CI/CD → Docker Build → Kubernetes Deploy → Running App
```

## Project Structure

```
resqnet/
├── app/
│   ├── app.py                  # Flask application
│   └── requirements.txt        # Python dependencies
├── docker/
│   ├── Dockerfile              # Container image
│   └── docker-compose.yml      # Local dev setup
├── k8s/
│   ├── deployment.yaml         # Kubernetes deployment (2 replicas)
│   └── service.yaml            # NodePort service (port 30080)
├── terraform/
│   ├── main.tf                 # AWS EC2 + VPC infrastructure
│   └── variables.tf            # Configurable variables
├── ansible/
│   ├── playbook.yml            # Server config + app deployment
│   └── inventory.ini           # Target servers
└── .github/
    └── workflows/
        └── ci-cd.yml           # GitHub Actions pipeline
```

## Quick Start (Windows)

### 1. Run locally with Docker
```bash
cd docker
docker-compose up --build
# Open http://localhost:5000
```

### 2. Run with Python directly
```bash
cd app
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```

### 3. Push to GitHub (triggers CI/CD automatically)
```bash
git init
git add .
git commit -m "Initial ResQNet commit"
git remote add origin https://github.com/YOUR_USERNAME/resqnet.git
git push -u origin main
```

## GitHub Secrets Required

Go to GitHub → Settings → Secrets and add:
- `DOCKER_USERNAME` — your Docker Hub username
- `DOCKER_PASSWORD` — your Docker Hub password/token
- `KUBE_CONFIG`     — base64-encoded kubeconfig (for cloud deployment)

## Terraform (Infrastructure)
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Ansible (Configuration)
```bash
cd ansible
# Edit inventory.ini with your server IP
ansible-playbook -i inventory.ini playbook.yml
```

## Kubernetes (Local with Docker Desktop)
```bash
# Enable Kubernetes in Docker Desktop Settings first
# Make sure kubectl is using the docker-desktop context
kubectl config use-context docker-desktop

# Replace the placeholder image with a real image you pushed to Docker Hub
# Example: ANTO-MELVIN/resqnet-app:latest

kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl get pods
# App runs at http://localhost:30080
```

## API Endpoints

| Method | Endpoint        | Description            |
|--------|----------------|------------------------|
| GET    | /               | Web UI                 |
| GET    | /health         | Health check           |
| GET    | /api/alerts     | Get all alerts         |
| POST   | /api/alerts     | Create new alert       |
| GET    | /api/reports    | Get community reports  |
| POST   | /api/reports    | Submit a report        |
| GET    | /api/resources  | Get nearby resources   |
