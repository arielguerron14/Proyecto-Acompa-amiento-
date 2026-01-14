# Trigger: push para ejecutar workflow tras credenciales
# Trigger: cambio menor para ejecutar workflow
provider "aws" {
  region = var.region
}

# AMI oficial Amazon Linux 2023 (sin IAM)
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

data "aws_availability_zones" "azs" {}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "lab-vpc" }
}

# Subnets
resource "aws_subnet" "public" {
  for_each = toset(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.azs.names[0]
  tags = { Name = "public-${each.value}" }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

# Associations
resource "aws_route_table_association" "public_assoc" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "web_sg" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

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
  for_each = toset(local.instance_names)
  ami           = data.aws_ami.al2023.id
  instance_type = var.instance_type
  subnet_id     = values(aws_subnet.public)[0].id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  associate_public_ip_address = true
  user_data = local.user_data
  tags = {
    Name = each.key
    Project = "lab-8-ec2"
  }
}
