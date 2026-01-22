# Auto-trigger workflow on push
# Last updated: 2026-01-16
provider "aws" {
  region = var.region
}

# Use the default VPC when not creating a new one
data "aws_vpc" "default" {
  default = true
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

# Subnet ids for the selected VPC (default or created), filtered by AZ
data "aws_subnets" "existing" {
  count = 1

  filter {
    name   = "vpc-id"
    values = [ local.vpc_id ]
  }

  filter {
    name   = "availability-zone"
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
  vpc_id = var.existing_vpc_id != "" ? var.existing_vpc_id : (length(aws_vpc.main) > 0 ? aws_vpc.main[0].id : data.aws_vpc.default.id)
}

# Subnet id selection: prefer explicit var.subnet_id, then subnets created by this module, otherwise use existing subnets in the VPC
locals {
  created_subnet_ids = length(aws_subnet.public) > 0 ? [for s in aws_subnet.public : s.id] : []
  existing_subnet_ids = length(data.aws_subnets.existing) > 0 ? data.aws_subnets.existing[0].ids : []
  subnet_ids = var.subnet_id != "" ? [var.subnet_id] : (length(local.created_subnet_ids) > 0 ? local.created_subnet_ids : local.existing_subnet_ids)
}

# Distribute public subnets across provided AZs (one subnet per AZ)
locals {
  public_subnet_az_map = {
    for idx, cidr in var.public_subnets : cidr => (
      length(var.azs) > idx ? var.azs[idx] : (length(var.azs) > 0 ? var.azs[0] : data.aws_availability_zones.azs[0].names[0])
    )
  }
}

# Subnets
resource "aws_subnet" "public" {
  for_each = var.existing_vpc_id == "" && var.create_vpc ? toset(var.public_subnets) : toset([])

  vpc_id                  = local.vpc_id
  cidr_block              = each.value
  map_public_ip_on_launch = true
  availability_zone       = lookup(local.public_subnet_az_map, each.value, (length(var.azs) > 0 ? var.azs[0] : data.aws_availability_zones.azs[0].names[0]))
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

## Simplified Security Groups (4 total) with common ingress rules
resource "aws_security_group" "sg1" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "lab-sg-1"
  vpc_id = local.vpc_id

  # SSH IPv4
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # HTTP/HTTPS IPv4
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # All TCP IPv4
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "sg-1", Project = "lab-8-ec2" }
}

resource "aws_security_group" "sg2" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "lab-sg-2"
  vpc_id = local.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "sg-2", Project = "lab-8-ec2" }
}

resource "aws_security_group" "sg3" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "lab-sg-3"
  vpc_id = local.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "sg-3", Project = "lab-8-ec2" }
}

resource "aws_security_group" "sg4" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "lab-sg-4"
  vpc_id = local.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "sg-4", Project = "lab-8-ec2" }
}

# Local: mapeo de instancias a security groups
locals {
  instance_sg_mapping = {
    # Map instances across 4 generic security groups (all share same ingress rules)
    "EC-Bastion"         = length(aws_security_group.sg1) > 0 ? [aws_security_group.sg1[0].id] : []
    "EC2-Frontend"       = length(aws_security_group.sg1) > 0 ? [aws_security_group.sg1[0].id] : []
    "EC2-API-Gateway"    = length(aws_security_group.sg2) > 0 ? [aws_security_group.sg2[0].id] : []
    "EC2-Reportes"       = length(aws_security_group.sg3) > 0 ? [aws_security_group.sg3[0].id] : []
    "EC2-CORE"           = length(aws_security_group.sg3) > 0 ? [aws_security_group.sg3[0].id] : []
    "EC2-Monitoring"     = length(aws_security_group.sg4) > 0 ? [aws_security_group.sg4[0].id] : []
    "EC2-Messaging"      = length(aws_security_group.sg3) > 0 ? [aws_security_group.sg3[0].id] : []
    "EC2-Notificaciones" = length(aws_security_group.sg3) > 0 ? [aws_security_group.sg3[0].id] : []
    "EC2-DB"             = length(aws_security_group.sg4) > 0 ? [aws_security_group.sg4[0].id] : []
  }
}

# User Data (Ubuntu + docker)
locals {
  # Minimal user data as requested
  user_data_default = <<EOF
#!/bin/bash
apt update -y
apt install -y docker.io
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu
EOF
  user_data_gateway = local.user_data_default
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
  vpc_security_group_ids = var.existing_security_group_id != "" ? [var.existing_security_group_id] : (
    length(local.instance_sg_mapping[each.key]) > 0 ? local.instance_sg_mapping[each.key] : []
  )
  associate_public_ip_address = true
  monitoring                  = true
  user_data = each.key == "EC2-API-Gateway" ? local.user_data_gateway : local.user_data_default
  user_data_replace_on_change = true
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
  security_groups    = concat(
    length(aws_security_group.sg1) > 0 ? [aws_security_group.sg1[0].id] : [],
    length(aws_security_group.sg2) > 0 ? [aws_security_group.sg2[0].id] : []
  )
  # Prefer newly created public subnets; fallback to discovered subnets
  subnets            = length(aws_subnet.public) > 0 ? [for s in aws_subnet.public : s.id] : local.alb_subnet_ids
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
  # Attach only the API Gateway instance if it exists
  for_each = { for k, v in aws_instance.fixed : k => v if k == "EC2-API-Gateway" }
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = each.value.id
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
