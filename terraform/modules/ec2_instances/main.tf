terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# Create EC2 instances
resource "aws_instance" "instances" {
  count                = var.instance_count
  ami                  = data.aws_ami.amazon_linux_2.id
  instance_type        = var.instance_type
  subnet_id            = var.subnet_ids[count.index % length(var.subnet_ids)]
  vpc_security_group_ids = [var.security_group_id]
  
  associate_public_ip_address = true

  tags = {
    Name        = "${var.project_name}-instance-${count.index + 1}"
    Environment = var.environment
    Module      = "ec2-instance"
  }

  lifecycle {
    ignore_changes = [
      tags_all,
      security_groups
    ]
  }
}

# Create target group attachment for each instance
resource "aws_lb_target_group_attachment" "instance_attachment" {
  count            = var.instance_count
  target_group_arn = var.target_group_arn
  target_id        = aws_instance.instances[count.index].id
  port             = 80

  depends_on = [aws_instance.instances]
}
