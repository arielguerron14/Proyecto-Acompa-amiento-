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
variable "instance_names" {
  type = list(string)
  default = [
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

# Get all EC2 instances to check which ones exist
data "aws_instances" "all" {
  filter {
    name   = "instance-state-name"
    values = ["running", "pending", "stopped"]
  }
  
  filter {
    name   = "tag:Project"
    values = ["proyecto-acompanamiento"]
  }
}

# Get details of existing instances
data "aws_instance" "existing" {
  for_each = toset(data.aws_instances.all.ids)
  
  instance_id = each.value
}

# Create a map of existing instances by name
locals {
  existing_instances = {
    for id, instance in data.aws_instance.existing :
    instance.tags["Name"] => instance.id
    if can(instance.tags["Name"])
  }
  
  # Determine which instances need to be created
  instances_to_create = {
    for name in var.instance_names :
    name => name if !contains(keys(local.existing_instances), name)
  }
}

# Create only missing EC2 instances
resource "aws_instance" "app" {
  for_each           = local.instances_to_create
  ami                = var.ami
  instance_type      = var.instance_type
  subnet_id          = element(var.subnets, index(var.instance_names, each.key) % length(var.subnets))
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
    Name    = each.key
    Project = "proyecto-acompanamiento"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# Create or get security group for ALB
data "aws_security_group" "alb" {
  name   = "alb-sg"
  vpc_id = var.vpc_id
}

# Create ALB
resource "aws_lb" "alb" {
  name               = "proyecto-acompanamiento-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [data.aws_security_group.alb.id]
  subnets            = var.subnets

  enable_deletion_protection = false

  tags = {
    Name    = "proyecto-acompanamiento-alb"
    Project = "proyecto-acompanamiento"
  }
}

# Create Target Group
resource "aws_lb_target_group" "tg" {
  name        = "tg-acompanamiento"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name    = "tg-acompanamiento"
    Project = "proyecto-acompanamiento"
  }
}

# Create ALB Listener
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

# Merge existing instances with newly created ones
locals {
  all_instance_ids = merge(
    { for name, instance in aws_instance.app : name => instance.id },
    local.existing_instances
  )
}

# Register ALL instances (existing and new) to target group
resource "aws_lb_target_group_attachment" "app" {
  for_each         = local.all_instance_ids
  target_group_arn = aws_lb_target_group.tg.arn
  target_id        = each.value
  port             = 80
}

# Outputs with detailed information
output "deployment_summary" {
  value = {
    total_instances = length(var.instance_names)
    existing_count = length(local.existing_instances)
    newly_created = length(local.instances_to_create)
    instances_created = keys(local.instances_to_create)
    all_instances = keys(local.all_instance_ids)
  }
  description = "Summary of deployment"
}

output "instance_ids" {
  value = local.all_instance_ids
  description = "All instance IDs (existing and newly created)"
}

output "instance_details" {
  value = {
    for name, id in local.all_instance_ids :
    name => {
      id = id
      ip = try(aws_instance.app[name].private_ip, "N/A - existing")
      state = try(aws_instance.app[name].instance_state, "running")
      type = var.instance_type
    }
  }
  description = "Detailed information about all instances"
}

output "alb_information" {
  value = {
    dns_name = aws_lb.alb.dns_name
    url = "http://${aws_lb.alb.dns_name}"
    target_group_arn = aws_lb_target_group.tg.arn
    registered_targets = length(aws_lb_target_group_attachment.app)
  }
  description = "ALB and target group information"
}

output "instances_created" {
  value = keys(local.instances_to_create)
  description = "Names of instances that were created in this apply"
}

output "idempotence_check" {
  value = {
    is_idempotent = length(local.instances_to_create) == 0
    message = length(local.instances_to_create) == 0 ? "✓ All instances already exist - no changes needed" : "⚠ Creating ${length(local.instances_to_create)} missing instances"
  }
  description = "Idempotence validation"
}
