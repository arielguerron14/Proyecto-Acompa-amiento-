

# ============================================================================
# ESTA CONFIGURACIÓN SOLO CONSULTA RECURSOS EXISTENTES
# NO CREA NADA EN AWS (requerimientos del lab Vocareum)
# Para crear recursos reales, cambiar a terraform/production.tf
# ============================================================================

# ============================================================================
# DATA SOURCES - Consultas de recursos existentes
# ============================================================================

# Get VPC
data "aws_vpc" "main" {
  id = "vpc-0f8670efa9e394cf3"
}

# Get Subnets
data "aws_subnets" "main" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Get Security Groups
data "aws_security_groups" "main" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Get AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================================================
# OUTPUTS - Información de la infraestructura existente
# ============================================================================

output "vpc_info" {
  description = "Información del VPC"
  value = {
    id               = data.aws_vpc.main.id
    cidr_block       = data.aws_vpc.main.cidr_block
    enable_dns       = data.aws_vpc.main.enable_dns_hostnames
    main_route_table = data.aws_vpc.main.main_route_table_id
  }
}

output "subnets_info" {
  description = "Información de las subnets"
  value = {
    subnet_ids = data.aws_subnets.main.ids
    count      = length(data.aws_subnets.main.ids)
  }
}

output "security_groups_info" {
  description = "Información de los security groups"
  value = {
    sg_ids = data.aws_security_groups.main.ids
    count  = length(data.aws_security_groups.main.ids)
  }
}

output "ami_info" {
  description = "AMI Ubuntu disponible"
  value = {
    id             = data.aws_ami.ubuntu.id
    name           = data.aws_ami.ubuntu.name
    virtualization = data.aws_ami.ubuntu.virtualization_type
  }
}

output "lab_environment_info" {
  description = "Información del ambiente de lab"
  value = {
    status           = "✓ Connected to AWS Lab (Vocareum)"
    vpc_accessible   = data.aws_vpc.main.id != "" ? true : false
    message          = "Lab environment only allows read-only operations. For infrastructure creation, use production.tf with a real AWS account."
    recommended_next = "1. Use Docker Compose for local simulation (docker-compose.infrastructure.yml)"
    terraform_next   = "2. Use production.tf when you have AWS account with full permissions"
  }
}
