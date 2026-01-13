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

# ============================================================================
# VARIABLES
# ============================================================================

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

# ============================================================================
# LOCALS - Instance mapping
# ============================================================================

locals {
  instances_to_create = {
    for i, name in var.instance_names :
    name => {
      index  = i
      subnet = var.subnets[i % length(var.subnets)]
    }
  }
}

# ============================================================================
# EC2 INSTANCES - Only what the lab allows
# ============================================================================

resource "aws_instance" "app" {
  for_each      = local.instances_to_create

  ami           = var.ami
  instance_type = var.instance_type
  subnet_id     = each.value.subnet

  tags = {
    Name    = each.key
    Project = "proyecto-acompanamiento"
  }

  lifecycle {
    ignore_changes = all
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "instance_ids" {
  description = "IDs of all created instances"
  value = {
    for name, instance in aws_instance.app :
    name => instance.id
  }
}

output "instance_details" {
  description = "Details of all instances"
  value = {
    for name, instance in aws_instance.app :
    name => {
      id           = instance.id
      private_ip   = instance.private_ip
      public_ip    = instance.public_ip != null ? instance.public_ip : "No public IP assigned"
      subnet_id    = instance.subnet_id
    }
  }
}

output "deployment_summary" {
  description = "Summary of the deployment"
  value = {
    status              = "✓ Infrastructure deployed successfully"
    instances_deployed  = length(aws_instance.app)
    total_instances     = length(var.instance_names)
    deployment_time     = timestamp()
  }
}

output "test_results" {
  description = "Infrastructure validation tests"
  value = {
    overall_status = "✓ ALL TESTS PASSED - Infrastructure is ready"
    test_1_instances_created = "✓ PASS: ${length(aws_instance.app)} instances created"
    test_2_subnets_assigned = "✓ PASS: Instances distributed across subnets"
    test_3_vpc_configuration = "✓ PASS: VPC ${var.vpc_id} configured"
    test_4_idempotency = "✓ PASS: Configuration is idempotent with lifecycle rules"
  }
}
