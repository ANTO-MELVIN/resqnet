terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# ─────────────────────────────────────────
# VPC & NETWORKING
# ─────────────────────────────────────────
resource "aws_vpc" "resqnet_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "resqnet-vpc", Project = "ResQNet" }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.resqnet_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags = { Name = "resqnet-public-subnet" }
}

resource "aws_internet_gateway" "resqnet_igw" {
  vpc_id = aws_vpc.resqnet_vpc.id
  tags   = { Name = "resqnet-igw" }
}

resource "aws_route_table" "resqnet_rt" {
  vpc_id = aws_vpc.resqnet_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.resqnet_igw.id
  }
  tags = { Name = "resqnet-route-table" }
}

resource "aws_route_table_association" "rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.resqnet_rt.id
}

# ─────────────────────────────────────────
# SECURITY GROUP
# ─────────────────────────────────────────
resource "aws_security_group" "resqnet_sg" {
  name        = "resqnet-sg"
  description = "ResQNet application security group"
  vpc_id      = aws_vpc.resqnet_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "ResQNet app port"
  }
  ingress {
    from_port   = 30080
    to_port     = 30080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes NodePort"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "resqnet-sg" }
}

# ─────────────────────────────────────────
# EC2 INSTANCE (App Server)
# ─────────────────────────────────────────
resource "aws_instance" "resqnet_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.resqnet_sg.id]
  key_name               = var.key_name

  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu
    curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x kubectl && mv kubectl /usr/local/bin/
    echo "ResQNet server initialized" >> /var/log/resqnet-setup.log
  EOF

  tags = {
    Name    = "resqnet-app-server"
    Project = "ResQNet"
    Env     = "production"
  }
}

# ─────────────────────────────────────────
# OUTPUTS
# ─────────────────────────────────────────
output "server_public_ip" {
  description = "Public IP of ResQNet server"
  value       = aws_instance.resqnet_server.public_ip
}

output "app_url" {
  description = "ResQNet application URL"
  value       = "http://${aws_instance.resqnet_server.public_ip}:5000"
}
