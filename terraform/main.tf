terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "proyecto-acompanamiento-tfstate"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC Data Source
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Security Group Data Source
data "aws_security_group" "main" {
  id = var.security_group_id
}

# EC2 Instances Data Sources
data "aws_instances" "all" {
  filter {
    name   = "instance-id"
    values = var.instance_ids
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

# Load Balancer Module
module "load_balancer" {
  source = "./modules/load_balancer"

  name              = "${var.project_name}-alb"
  vpc_id            = var.vpc_id
  security_group_id = var.security_group_id
  instance_ids      = data.aws_instances.all.ids
  subnets           = var.subnet_ids
  environment       = var.environment

  target_group_config = {
    name     = "${var.project_name}-tg"
    port     = 80
    protocol = "HTTP"
    health_check = {
      path                = "/"
      port                = "80"
      healthy_threshold   = 2
      unhealthy_threshold = 2
      timeout             = 5
      interval            = 30
      matcher             = "200-299"
    }
  }

  listener_config = {
    port     = 80
    protocol = "HTTP"
  }

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Outputs
output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.load_balancer.alb_dns_name
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = module.load_balancer.alb_arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.load_balancer.target_group_arn
}

output "registered_instances" {
  description = "List of registered instances"
  value       = data.aws_instances.all.ids
}

output "registered_instances_ips" {
  description = "List of registered instance IP addresses"
  value       = data.aws_instances.all.private_ips
}
