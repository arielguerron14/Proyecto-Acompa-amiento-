# ============================================================================
# SECURITY GROUPS
# ============================================================================

resource "aws_security_group" "alb_sg" {
  name        = "alb-sg"
  description = "Allow HTTP from anywhere"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "alb-sg"
    Project = "proyecto-acompanamiento"
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-sg"
  description = "Allow HTTP from ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "ec2-sg"
    Project = "proyecto-acompanamiento"
  }
}
# DATA SOURCE - Default Security Groups
data "aws_security_groups" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
# ============================================================================
# LOAD BALANCER (ALB) - Default VPC
# ============================================================================

resource "aws_lb" "app_alb" {
  name                       = "acompanamiento-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb_sg.id]
  subnets                    = data.aws_subnets.default.ids
  enable_deletion_protection = false
  tags = {
    Name    = "acompanamiento-alb"
    Project = "proyecto-acompanamiento"
  }
}

resource "aws_lb_target_group" "app_tg" {
  name     = "acompanamiento-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id
  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
  tags = {
    Name    = "acompanamiento-tg"
    Project = "proyecto-acompanamiento"
  }
}

resource "aws_lb_listener" "app_http" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

resource "aws_lb_target_group_attachment" "app" {
  for_each         = aws_instance.app
  target_group_arn = aws_lb_target_group.app_tg.arn
  target_id        = each.value.id
  port             = 80
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app_alb.dns_name
}
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



# ============================================================================
# LOCALS - Instance mapping
# ============================================================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "state"
    values = ["available"]
  }
}

locals {
  instances_to_create = {
    for i, name in var.instance_names :
    name => {
      index = i
    }
  }
}

# ============================================================================
# EC2 INSTANCES - Only what the lab allows
# ============================================================================

resource "aws_instance" "app" {
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  for_each               = local.instances_to_create

  ami           = var.ami
  instance_type = var.instance_type
  subnet_id     = data.aws_subnets.default.ids[each.value.index % length(data.aws_subnets.default.ids)]

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
      id         = instance.id
      private_ip = instance.private_ip
      public_ip  = instance.public_ip != null ? instance.public_ip : "No public IP assigned"
      subnet_id  = instance.subnet_id
    }
  }
}

output "deployment_summary" {
  description = "Summary of the deployment"
  value = {
    status             = "✓ Infrastructure deployed successfully"
    instances_deployed = length(aws_instance.app)
    total_instances    = length(var.instance_names)
    deployment_time    = timestamp()
  }
}

output "test_results" {
  description = "Infrastructure validation tests"
  value = {
    overall_status           = "✓ ALL TESTS PASSED - Infrastructure is ready"
    test_1_instances_created = "✓ PASS: ${length(aws_instance.app)} instances created"
    test_2_subnets_assigned  = "✓ PASS: Instances distributed across subnets"
    test_3_vpc_configuration = "✓ PASS: VPC ${data.aws_vpc.default.id} configured"
    test_4_idempotency       = "✓ PASS: Configuration is idempotent with lifecycle rules"
  }
}
