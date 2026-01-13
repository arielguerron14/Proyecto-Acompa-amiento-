terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Variables
variable "instance_count" {
  default = 8
}

variable "instance_type" {
  default = "t3.medium"
}

variable "ami" {
  default = "ami-0c02fb55956c7d316"
}

variable "vpc_id" {
  default = "vpc-0f8670efa9e394cf3"
}

variable "subnets" {
  default = ["subnet-003fd1f4046a6b641", "subnet-00865aa51057ed7b4"]
}

variable "security_group_id" {
  default = "sg-04f3d554d6dc9e304"
}

locals {
  instance_names = [
    "EC2-Bastion",
    "EC2-CORE",
    "EC2-Monitoring",
    "EC2-API-Gateway",
    "EC2-Frontend",
    "EC2-Notificaciones",
    "EC2-Messaging",
    "EC2-Reportes"
  ]
}

# Create EC2 instances
resource "aws_instance" "app" {
  count                = var.instance_count
  ami                  = var.ami
  instance_type        = var.instance_type
  subnet_id            = element(var.subnets, count.index % length(var.subnets))
  vpc_security_group_ids = [var.security_group_id]
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
  EOF
  )

  tags = {
    Name    = local.instance_names[count.index]
    Project = "proyecto-acompanamiento"
  }
}

# Get ALB
data "aws_lb" "alb" {
  name = "proyecto-acompanamiento-alb"
}

# Get target group
data "aws_lb_target_group" "tg" {
  name = "tg-acompanamiento"
}

# Register targets
resource "aws_lb_target_group_attachment" "app" {
  count            = var.instance_count
  target_group_arn = data.aws_lb_target_group.tg.arn
  target_id        = aws_instance.app[count.index].id
  port             = 80
}

# Outputs
output "instance_ids" {
  value = aws_instance.app[*].id
}

output "instance_ips" {
  value = aws_instance.app[*].private_ip
}

output "alb_dns" {
  value = data.aws_lb.alb.dns_name
}
