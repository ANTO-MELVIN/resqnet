# ResQNet DevOps Project - Examination Evidence Document

## ✅ RUBRIC MAPPING & PROOF POINTS

---

## 1️⃣ VERSION CONTROL & COLLABORATION [8 MARKS]

**Rubric Requirement:** Demonstrates strong understanding of Git workflow (branching, merging, pull requests, commits) with effective collaboration

### Evidence 1: Branch Structure
**Command to show examiner:**
```bash
git branch -a
```
**Expected Output:**
```
  develop
  feature-setup
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/develop
  remotes/origin/feature-setup
  remotes/origin/main
```
**Shows:** ✅ Multiple branches created locally and pushed remotely

---

### Evidence 2: Commit History (10 Meaningful Commits)
**Command to show examiner:**
```bash
git log --oneline --graph --decorate -n 20
```
**Expected Output:**
```
*   eb71a5e (HEAD -> main, origin/main) Remove deprecated mobile app module
*   2a09285 Merge develop into main
|\
| * 5db7437 (origin/develop, develop) Merge feature-setup into develop
|/|
| * 596d551 (origin/feature-setup) Add deployment guide and submission checklist
| * 49db914 Add Terraform Kubernetes namespace IaC
| * 37a9e58 Update CI/CD pipeline for real Kubernetes deployment
| * 0690a17 Add Kubernetes namespace manifest
| * dc2f146 Add Kubernetes service namespace configuration
| * 3bb60dd Configure Kubernetes deployment with MongoDB secret
| * 1468eb8 Integrate frontend with backend API endpoints
| * 31d8040 Add responsive dashboard styling
| * 6d85da3 Add web dashboard layout
| * 6765a45 Fix MongoDB connection and API data handling
|/
* 5661628 qwertyuiop[
```
**Shows:** ✅ 10+ meaningful commits ✅ Clear commit messages ✅ Feature branch workflow

---

### Evidence 3: Merge Commits (Collaboration Style)
**What to highlight:**
- Merge commit: "Merge feature-setup into develop" 
- Merge commit: "Merge develop into main"
- Merge commit: "Sync mobile module removal from main"

**Shows:** ✅ Branch merging ✅ Collaboration workflow ✅ Integration of features

---

### Evidence 4: Repository Remote
**Command to show examiner:**
```bash
git remote -v
```
**Expected Output:**
```
origin  https://github.com/ANTO-MELVIN/resqnet.git (fetch)
origin  https://github.com/ANTO-MELVIN/resqnet.git (push)
```
**Shows:** ✅ Code pushed to remote GitHub ✅ Public repository

---

### Evidence 5: Commit Details (Sample)
**Command to show examiner:**
```bash
git show 596d551 --stat
```
**Shows:** ✅ Actual file changes in commits ✅ Work evidence

---

**📸 SCREENSHOTS TO TAKE:**
1. GitHub browser: Branches page (main, develop, feature-setup)
2. GitHub browser: Commit history graph
3. GitHub browser: Pull requests (if created) or at least merged commits
4. Terminal: git log output
5. Terminal: git branch -a output

---

## 2️⃣ CI/CD PIPELINE IMPLEMENTATION [7 MARKS]

**Rubric Requirement:** End-to-end CI/CD pipeline with build, test, deploy stages fully automated

### Evidence 1: Workflow File Exists
**File location:** `.github/workflows/ci-cd.yml`

**Contains three jobs:**
1. **build-and-test** - Builds, tests Python app
2. **docker-build** - Builds and pushes Docker image
3. **deploy** - Deploys to Kubernetes

---

### Evidence 2: Automated Build & Test
**In workflow:**
```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
      - name: Set up Python
      - name: Install dependencies
        run: pip install -r app/requirements.txt
      - name: Run application tests
        run: |
          python -c "
          from app import app
          client = app.test_client()
          r = client.get('/health')
          assert r.status_code == 200
          print('Health check passed')
          r2 = client.get('/api/alerts')
          assert r2.status_code == 200
          print('Alerts API passed')
```

**Shows:** ✅ Automated build ✅ Automated testing ✅ Health checks

---

### Evidence 3: Automated Docker Build & Push
**In workflow:**
```yaml
jobs:
  docker-build:
    needs: build-and-test
    steps:
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/resqnet-app:latest
            ${{ secrets.DOCKER_USERNAME }}/resqnet-app:${{ env.DOCKER_TAG }}
```

**Shows:** ✅ Docker image build ✅ Automated push to Docker Hub ✅ Image versioning

---

### Evidence 4: Automated Kubernetes Deploy
**In workflow:**
```yaml
jobs:
  deploy:
    needs: docker-build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Configure kubeconfig
      - name: Deploy manifests
        run: |
          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml
      - name: Update image and verify rollout
        run: |
          kubectl set image deployment/resqnet-deployment resqnet-app=${IMAGE}
          kubectl rollout status deployment/resqnet-deployment --timeout=180s
```

**Shows:** ✅ Kubernetes deployment ✅ Service creation ✅ Rollout verification

---

### Evidence 5: Pipeline Trigger
**In workflow:**
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
```

**Shows:** ✅ Automated on push ✅ Automatic on PR

---

**📸 SCREENSHOTS TO TAKE:**
1. GitHub Actions: Latest workflow run showing all 3 jobs passing
2. GitHub Actions: Job logs (build, docker-build, deploy sections)
3. Docker Hub: Pushed image with tags
4. Workflow file in editor: Full `.github/workflows/ci-cd.yml`

---

## 3️⃣ CONTAINERIZATION & DEPLOYMENT [8 MARKS]

**Rubric Requirement:** Application fully containerized with Docker and deployed using orchestration (Kubernetes)

### Evidence 1: Dockerfile
**File location:** `docker/Dockerfile`

**Contains:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "60", "app:app"]
```

**Shows:** ✅ Multi-stage containerization ✅ Health checks ✅ Production-ready image

---

### Evidence 2: Kubernetes Deployment
**File location:** `k8s/deployment.yaml`

**Contains:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resqnet-deployment
  namespace: resqnet
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
  template:
    spec:
      containers:
        - name: resqnet-app
          image: antomelvin/resqnet-app:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 5000
          env:
            - name: MONGO_URI
              valueFrom:
                secretKeyRef:
                  name: resqnet-secrets
                  key: MONGO_URI
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 10
```

**Shows:** ✅ 2 replicas ✅ Rolling updates ✅ Resource requests/limits ✅ Health probes ✅ Secret management

---

### Evidence 3: Kubernetes Service
**File location:** `k8s/service.yaml`

**Contains:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: resqnet-service
  namespace: resqnet
spec:
  selector:
    app: resqnet
  type: NodePort
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5000
      nodePort: 30080
```

**Shows:** ✅ Service exposure ✅ Port mapping ✅ Load balancing

---

### Evidence 4: Kubernetes Namespace
**File location:** `k8s/namespace.yaml`

**Contains:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: resqnet
  labels:
    app: resqnet
```

**Shows:** ✅ Namespace isolation ✅ Resource organization

---

### Evidence 5: Live Deployment Proof
**Command to show examiner:**
```bash
kubectl get pods -n resqnet
```

**Expected Output:**
```
NAME                                  READY   STATUS    RESTARTS   AGE
resqnet-deployment-586f646b75-bg6hr   1/1     Running   2          10d
resqnet-deployment-586f646b75-q6ch5   1/1     Running   2          10d
```

**Shows:** ✅ 2 pods running ✅ Ready state ✅ Active deployment

---

### Evidence 6: Service Status
**Command to show examiner:**
```bash
kubectl get svc -n resqnet
```

**Expected Output:**
```
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
resqnet-service   NodePort    10.99.240.229   <none>        80:30080/TCP   10d
```

**Shows:** ✅ Service is running ✅ Port exposed ✅ NodePort configured

---

### Evidence 7: Application Running
**Command to show examiner:**
```bash
curl http://localhost:30080
```
**Or open in browser:** `http://localhost:30080`

**Shows:** ✅ Web UI functioning ✅ API responding

---

**📸 SCREENSHOTS TO TAKE:**
1. Dockerfile in editor
2. deployment.yaml in editor
3. service.yaml in editor
4. namespace.yaml in editor
5. Terminal: kubectl get pods -n resqnet (Running status)
6. Terminal: kubectl get svc -n resqnet (Service exposed)
7. Browser: http://localhost:30080 (App loaded with Dashboard)
8. Terminal: kubectl rollout status deployment/resqnet-deployment -n resqnet

---

## 4️⃣ INFRASTRUCTURE AS CODE (IaC) [7 MARKS]

**Rubric Requirement:** Infrastructure as Code (IaC) with automation

### Evidence 1: Terraform AWS Infrastructure
**File location:** `terraform/main.tf`

**Manages:**
- VPC (Virtual Private Cloud)
- Subnet
- Internet Gateway
- Route Table
- Security Group
- EC2 Instance

**Shows:** ✅ AWS infrastructure ✅ Automation ✅ Fully defined as code

---

### Evidence 2: Terraform Variables
**File location:** `terraform/variables.tf`

**Contains:**
```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "instance_type" {
  default = "t2.micro"
}

variable "ami_id" {
  default = "ami-0c7217cdde317cfec"
}

variable "key_name" {
  default = "resqnet-key"
}
```

**Shows:** ✅ Parameterized configuration ✅ Reusable infrastructure

---

### Evidence 3: Terraform Kubernetes IaC
**File location:** `terraform/k8s-namespace.tf`

**Contains:**
```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "resqnet" {
  metadata {
    name = "resqnet"
  }
}
```

**Shows:** ✅ Kubernetes namespace creation ✅ Infrastructure provisioned via code

---

### Evidence 4: Terraform Commands to Show
**Command 1: Initialize Terraform**
```bash
cd terraform
terraform init
```

**Command 2: Plan Infrastructure**
```bash
terraform plan
```

**Command 3: Apply Infrastructure**
```bash
terraform apply
```

**Shows:** ✅ IaC workflow ✅ State management ✅ Reproducible infrastructure

---

### Evidence 5: Ansible Configuration Management
**File location:** `ansible/playbook.yml`

**Manages:**
- System updates
- Docker installation
- App deployment
- Health checks

**File location:** `ansible/inventory.ini`

**Shows:** ✅ Server configuration as code ✅ Automation of deployment

---

**📸 SCREENSHOTS TO TAKE:**
1. `terraform/main.tf` in editor (VPC, SG, EC2)
2. `terraform/variables.tf` in editor
3. `terraform/k8s-namespace.tf` in editor
4. Terminal: `terraform init` output
5. Terminal: `terraform plan` output
6. Terminal: `terraform apply` output (if applicable)
7. `ansible/playbook.yml` in editor
8. `ansible/inventory.ini` in editor

---

## 📋 FINAL SUBMISSION CHECKLIST

### Before Viva:
- [ ] Take all screenshots listed in each section above
- [ ] Save screenshots in a folder: `/submission_evidence/`
- [ ] Test: `http://localhost:30080` loads your app
- [ ] Verify: `kubectl get pods -n resqnet` shows 2 Running pods
- [ ] Verify: `kubectl get svc -n resqnet` shows resqnet-service NodePort
- [ ] Verify: GitHub shows all branches and commits
- [ ] Verify: GitHub Actions shows successful pipeline runs

### What to Present to Examiner:
1. **Git & Collaboration (8 marks)**
   - Show: `git branch -a` (all branches)
   - Show: `git log --graph` (commits & merges)
   - Show: GitHub UI (branches, commits, PR history)

2. **CI/CD Pipeline (7 marks)**
   - Show: `.github/workflows/ci-cd.yml` (workflow definition)
   - Show: GitHub Actions tab (successful runs)
   - Show: Docker Hub (pushed images with tags)

3. **Containerization & Kubernetes (8 marks)**
   - Show: `Dockerfile` (image definition)
   - Show: `k8s/deployment.yaml` (2 replicas, health checks)
   - Show: `k8s/service.yaml` (NodePort 30080)
   - Show: `kubectl get pods -n resqnet` (Running status)
   - Show: `kubectl get svc -n resqnet` (Service exposed)
   - Show: Browser at `http://localhost:30080` (App working)

4. **Infrastructure as Code (7 marks)**
   - Show: `terraform/main.tf` (AWS infrastructure)
   - Show: `terraform/k8s-namespace.tf` (K8s namespace)
   - Show: `terraform init/plan` output
   - Show: `ansible/playbook.yml` (configuration management)

---

## Total Marks Potential: 30 Marks ✅

You now have evidence for all 4 major rubric categories.
