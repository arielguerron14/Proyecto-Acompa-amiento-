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

# Get existing instances by name
data "aws_instances" "existing" {
  filter {
    name   = "tag:Name"
    values = var.instance_names
  }

  filter {
    name   = "instance-state-name"
    values = ["running", "pending", "stopped"]
  }
}

# Create a map of existing instances by name
locals {
  existing_instances = {
    for instance in data.aws_instances.existing.instances : 
    instance.tags["Name"] => instance.id
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

# Combine newly created and existing instances
locals {
  all_instance_ids = merge(
    { for name, instance in aws_instance.app : name => instance.id },
    local.existing_instances
  )
}

# Get ALB
data "aws_lb" "alb" {
  name = "proyecto-acompanamiento-alb"
}

# Get target group
data "aws_lb_target_group" "tg" {
  name = "tg-acompanamiento"
}

# Register ALL instances (existing and new) to target group
resource "aws_lb_target_group_attachment" "app" {
  for_each         = local.all_instance_ids
  target_group_arn = data.aws_lb_target_group.tg.arn
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
    dns_name = data.aws_lb.alb.dns_name
    url = "http://${data.aws_lb.alb.dns_name}"
    target_group_arn = data.aws_lb_target_group.tg.arn
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
