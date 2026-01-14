# Trigger: push para ejecutar workflow tras credenciales
# Trigger: cambio menor para ejecutar workflow
provider "aws" {
  region = var.region
}

# AMI oficial Amazon Linux 2023 (opcional: se usa si var.ami_id no está especificada)
data "aws_ami" "al2023" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# AZ lookup opcional (usar var.azs si se pasa desde CI)
data "aws_availability_zones" "azs" {
  count = length(var.azs) == 0 ? 1 : 0
}

# Default VPC lookup disabled to avoid ec2:DescribeVpcs in restricted lab.
# If you want to use an existing or default VPC, set TF_VAR_existing_vpc_id to the VPC id.
# (We avoid querying default VPC because the lab's IAM forbids ec2:DescribeVpcs.)
# (This data lookup was removed to prevent the workflow failing under restricted creds.)

# Subnet ids for an existing VPC (opcional)
data "aws_subnets" "existing" {
  count = var.existing_vpc_id != "" ? 1 : 0

  filter {
    name   = "vpc-id"
    values = [ var.existing_vpc_id ]
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

# Subnet id selection: prefer subnets created by this module, otherwise use existing subnets in the VPC
locals {
  created_subnet_ids = length(aws_subnet.public) > 0 ? [for s in aws_subnet.public : s.id] : []
  existing_subnet_ids = length(data.aws_subnets.existing) > 0 ? data.aws_subnets.existing[0].ids : []
  subnet_ids = length(local.created_subnet_ids) > 0 ? local.created_subnet_ids : local.existing_subnet_ids
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# User Data simple
locals {
  user_data = <<EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl enable httpd
systemctl start httpd
echo "<h1>Hola desde EC2 $(hostname)</h1>" > /var/www/html/index.html
EOF
}


# 10 instancias EC2 fijas
locals {
  instance_names = [
    "EC2-API",
    "EC2-Bastion",
    "EC2-CORE",
    "EC2-frontend",
    "EC2-Messaging",
    "EC2-Auth",
    "EC2-Admin",
    "EC2-DB"
  ]
}

resource "aws_instance" "fixed" {
  for_each = var.create_instances ? toset(local.instance_names) : toset([])
  ami           = var.ami_id != "" ? var.ami_id : data.aws_ami.al2023[0].id
  instance_type = var.instance_type
  subnet_id     = length(local.subnet_ids) > 0 ? local.subnet_ids[0] : ""
  vpc_security_group_ids = var.existing_security_group_id != "" ? [var.existing_security_group_id] : (length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : [])
  associate_public_ip_address = true
  user_data = local.user_data
  tags = {
    Name = each.key
    Project = "lab-8-ec2"
  }
}
