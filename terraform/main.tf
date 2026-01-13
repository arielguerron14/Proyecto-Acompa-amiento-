terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend is configured in backend.tf or via CLI flags
  # For local development, uses local state
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

# Load Balancer Module
module "load_balancer" {
  source = "./modules/load_balancer"

  name              = "${var.project_name}-alb"
  vpc_id            = var.vpc_id
  security_group_id = var.security_group_id
  instance_ids      = var.instance_ids
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

# EC2 Instances Module
module "ec2_instances" {
  source = "./modules/ec2_instances"

  aws_region        = var.aws_region
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = var.vpc_id
  security_group_id = var.security_group_id
  subnet_ids        = var.subnet_ids
  instance_count    = 8
  instance_type     = "t3.medium"
  target_group_arn  = module.load_balancer.target_group_arn

  depends_on = [module.load_balancer]
}
