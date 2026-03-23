# ResQNet Submission Checklist

## Version Control
- [ ] Branches created: main, develop, feature-setup
- [ ] 8 to 10 meaningful commits completed
- [ ] feature-setup merged into develop
- [ ] develop merged into main

## CI/CD Pipeline
- [ ] GitHub Actions build job passed
- [ ] Docker image pushed to Docker Hub
- [ ] Kubernetes deploy job passed

## Containerization and Deployment
- [ ] Dockerfile used for image build
- [ ] deployment.yaml and service.yaml applied
- [ ] Pods are Running in cluster
- [ ] Application is reachable from service endpoint

## Infrastructure as Code
- [ ] Terraform AWS infrastructure reviewed
- [ ] Terraform Kubernetes namespace applied
- [ ] terraform init and terraform apply evidence captured

## Demo Evidence
- [ ] Branch and commit screenshots
- [ ] Pull request and merge screenshots
- [ ] Actions workflow success screenshots
- [ ] kubectl get pods and kubectl get svc screenshots
