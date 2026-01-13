# Application Load Balancer Module

variable "name" {
  description = "Name of the load balancer"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "instance_ids" {
  description = "List of EC2 instance IDs to register"
  type        = list(string)
}

variable "subnets" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "target_group_config" {
  description = "Target group configuration"
  type = object({
    name     = string
    port     = number
    protocol = string
    health_check = object({
      path                = string
      port                = string
      healthy_threshold   = number
      unhealthy_threshold = number
      timeout             = number
      interval            = number
      matcher             = string
    })
  })
}

variable "listener_config" {
  description = "Listener configuration"
  type = object({
    port     = number
    protocol = string
  })
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}

# Create Application Load Balancer
resource "aws_lb" "main" {
  name               = var.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.subnets

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = var.name
    Environment = var.environment
    CreatedAt   = ""
    ManagedBy   = ""
    Project     = ""
  }

  lifecycle {
    ignore_changes = [tags_all, tags["CreatedAt"], tags["ManagedBy"], tags["Project"]]
  }
}

# Create Target Group
resource "aws_lb_target_group" "main" {
  name        = var.target_group_config.name
  port        = var.target_group_config.port
  protocol    = var.target_group_config.protocol
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    healthy_threshold   = var.target_group_config.health_check.healthy_threshold
    unhealthy_threshold = var.target_group_config.health_check.unhealthy_threshold
    timeout             = var.target_group_config.health_check.timeout
    interval            = var.target_group_config.health_check.interval
    path                = var.target_group_config.health_check.path
    port                = var.target_group_config.health_check.port
    matcher             = var.target_group_config.health_check.matcher
  }

  stickiness {
    type            = "lb_cookie"
    enabled         = true
    cookie_duration = 86400
  }

  tags = {
    Name        = var.target_group_config.name
    Environment = var.environment
    CreatedAt   = ""
    ManagedBy   = ""
    Project     = ""
  }

  lifecycle {
    ignore_changes = [tags_all, tags["CreatedAt"], tags["ManagedBy"], tags["Project"]]
  }
}

# Register instances to target group
resource "aws_lb_target_group_attachment" "instances" {
  count            = length(var.instance_ids)
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = var.instance_ids[count.index]
  port             = var.target_group_config.port
}

# Create Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = var.listener_config.port
  protocol          = var.listener_config.protocol

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = aws_lb_target_group.main.name
}
