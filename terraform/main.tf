# Trigger: push para ejecutar workflow tras credenciales
# Trigger: cambio menor para ejecutar workflow
provider "aws" {
  region = var.region
}

# AMI Ubuntu lookup (opcional: se usa si var.ami_id no está especificada)
data "aws_ami" "ubuntu" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["099720109477"] # Canonical Ubuntu owner

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-*-amd64-server-*"]
  }
}

# AZ lookup opcional (usar var.azs si se pasa desde CI)
data "aws_availability_zones" "azs" {
  count = length(var.azs) == 0 ? 1 : 0
}

# Subnet ids for an existing VPC (opcional)
data "aws_subnets" "existing" {
  count = var.existing_vpc_id != "" ? 1 : 0

  filter {
    name   = "vpc-id"
    values = [ var.existing_vpc_id ]
  }

  filter {
    name = "availability-zone"
    values = [ length(var.azs) > 0 ? var.azs[0] : data.aws_availability_zones.azs[0].names[0] ]
  }
}

# VPC
resource "aws_vpc" "main" {
  count                = var.create_vpc && var.existing_vpc_id == "" ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "lab-vpc" }
}

# Local VPC id (uses existing_vpc_id if provided)
locals {
  vpc_id = var.existing_vpc_id != "" ? var.existing_vpc_id : (length(aws_vpc.main) > 0 ? aws_vpc.main[0].id : "")
}

# Subnet id selection: prefer explicit var.subnet_id, then subnets created by this module, otherwise use existing subnets in the VPC
locals {
  created_subnet_ids = length(aws_subnet.public) > 0 ? [for s in aws_subnet.public : s.id] : []
  existing_subnet_ids = length(data.aws_subnets.existing) > 0 ? data.aws_subnets.existing[0].ids : []
  subnet_ids = var.subnet_id != "" ? [var.subnet_id] : (length(local.created_subnet_ids) > 0 ? local.created_subnet_ids : local.existing_subnet_ids)
}

# Subnets
resource "aws_subnet" "public" {
  for_each = var.existing_vpc_id == "" && var.create_vpc ? toset(var.public_subnets) : toset([])

  vpc_id                  = local.vpc_id
  cidr_block              = each.value
  map_public_ip_on_launch = true
  availability_zone       = length(var.azs) > 0 ? var.azs[0] : data.aws_availability_zones.azs[0].names[0]
  tags = { Name = "public-${each.value}" }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  count = var.create_vpc && var.existing_vpc_id == "" ? 1 : 0
  vpc_id = local.vpc_id
}

# Route Table
resource "aws_route_table" "public" {
  count  = var.create_vpc && var.existing_vpc_id == "" ? 1 : 0
  vpc_id = local.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw[0].id
  }
}

# Associations
resource "aws_route_table_association" "public_assoc" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[0].id
}

# Security Group
resource "aws_security_group" "web_sg" {
  count = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "web-sg"
  vpc_id = local.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# User Data (Ubuntu + docker)
locals {
  user_data = <<EOF
#!/bin/bash
apt update -y
apt install -y docker.io
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu
EOF
}


# Instances required by the user
locals {
  instance_names = [
    "EC2-Frontend",
    "EC2-API-Gateway",
    "EC2-Reportes",
    "EC2-CORE",
    "EC2-Monitoring",
    "EC2-Messaging",
    "EC-Bastion",
    "EC2-Notificaciones",
    "EC2-DB"
  ]
}

resource "aws_instance" "fixed" {
  for_each = var.create_instances ? toset(local.instance_names) : toset([])
  ami           = var.ami_id != "" ? var.ami_id : data.aws_ami.ubuntu[0].id
  instance_type = var.instance_type
  subnet_id     = length(local.subnet_ids) > 0 ? local.subnet_ids[0] : ""
  key_name      = var.ssh_key_name != "" ? var.ssh_key_name : null
  vpc_security_group_ids = var.existing_security_group_id != "" ? [var.existing_security_group_id] : (length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : [])
  associate_public_ip_address = true
  user_data = local.user_data
  tags = {
    Name = each.key
    Project = "lab-8-ec2"
  }
}

# Elastic IPs for selected instances
resource "aws_eip" "eip" {
  for_each = toset(var.eip_instances)
  instance = aws_instance.fixed[each.key].id
  depends_on = [aws_instance.fixed]
}

# Get all subnets in the VPC for ALB (requires 2+ in different AZs)
data "aws_subnets" "all_for_alb" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
}

locals {
  alb_subnet_ids = length(data.aws_subnets.all_for_alb.ids) >= 2 ? data.aws_subnets.all_for_alb.ids : concat(local.subnet_ids, local.subnet_ids)
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "lab-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : []
  subnets            = local.alb_subnet_ids
  tags = {
    Name = "lab-alb"
    Project = "lab-8-ec2"
  }
}

# Target Group for web instances (Frontend, API-Gateway, Reportes)
resource "aws_lb_target_group" "web" {
  name        = "lab-alb-web-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = local.vpc_id
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
    Name = "lab-alb-web-tg"
    Project = "lab-8-ec2"
  }
}

# Register web instances to target group
resource "aws_lb_target_group_attachment" "web" {
  for_each         = toset(["EC2-Frontend", "EC2-API-Gateway", "EC2-Reportes"])
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.fixed[each.key].id
  port             = 80
}

# Listener for HTTP (port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# Listener for HTTPS (port 443) - forwards to HTTP for now
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTP" # Note: Use HTTPS in production with SSL certificate

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}
