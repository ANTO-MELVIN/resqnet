variable "aws_region" {
  description = "AWS region to deploy ResQNet"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "ami_id" {
  description = "Ubuntu 22.04 AMI ID (update for your region)"
  type        = string
  default     = "ami-0c7217cdde317cfec"
}

variable "key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
  default     = "resqnet-key"
}
