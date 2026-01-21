# Auto-trigger workflow on push
# Last updated: 2026-01-16
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

# Security Groups

# 1. Bastion Security Group - Solo SSH desde cualquier lugar
resource "aws_security_group" "bastion_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "bastion-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "SSH from anywhere"
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

  tags = {
    Name = "bastion-sg"
    Project = "lab-8-ec2"
  }
}

# 2. Web/Frontend Security Group - HTTP, HTTPS y SSH desde bastion
resource "aws_security_group" "web_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "web-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-sg"
    Project = "lab-8-ec2"
  }
}

# 3. API Gateway Security Group - Puertos API + SSH desde bastion
resource "aws_security_group" "api_gateway_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "api-gateway-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "HTTP for ALB/clients"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "API Gateway HTTP"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "API Gateway from Web/Frontend"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    security_groups = length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : []
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "api-gateway-sg"
    Project = "lab-8-ec2"
  }
}

# 4. Microservices Security Group - Puertos 3000-5010 + SSH desde bastion
resource "aws_security_group" "microservices_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "microservices-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "Microservices ports from VPC"
    from_port   = 3000
    to_port     = 5010
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Microservices ports from API Gateway"
    from_port   = 3000
    to_port     = 5010
    protocol    = "tcp"
    security_groups = length(aws_security_group.api_gateway_sg) > 0 ? [aws_security_group.api_gateway_sg[0].id] : []
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "microservices-sg"
    Project = "lab-8-ec2"
  }
}

# 5. Database Security Group - MongoDB, PostgreSQL, Redis
resource "aws_security_group" "database_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "database-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "MongoDB from VPC"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "MongoDB from microservices"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    security_groups = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
  }

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "PostgreSQL from microservices"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
  }

  ingress {
    description = "Redis from VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Redis from microservices"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "database-sg"
    Project = "lab-8-ec2"
  }
}

# 6. Messaging Security Group - Kafka, RabbitMQ, MQTT
resource "aws_security_group" "messaging_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "messaging-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "Kafka from VPC"
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Kafka from microservices"
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    security_groups = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
  }

  ingress {
    description = "RabbitMQ from VPC"
    from_port   = 5672
    to_port     = 5672
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "RabbitMQ from microservices"
    from_port   = 5672
    to_port     = 5672
    protocol    = "tcp"
    security_groups = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
  }

  ingress {
    description = "RabbitMQ Management"
    from_port   = 15672
    to_port     = 15672
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Acceso web management
  }

  ingress {
    description = "MQTT from VPC"
    from_port   = 1883
    to_port     = 1883
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "MQTT from microservices"
    from_port   = 1883
    to_port     = 1883
    protocol    = "tcp"
    security_groups = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
  }

  ingress {
    description = "MQTT WebSocket"
    from_port   = 9001
    to_port     = 9001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "messaging-sg"
    Project = "lab-8-ec2"
  }
}

# 7. Monitoring Security Group - Prometheus, Grafana
resource "aws_security_group" "monitoring_sg" {
  count  = var.create_security_group && var.existing_security_group_id == "" ? 1 : 0
  name   = "monitoring-sg"
  vpc_id = local.vpc_id

  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Acceso web
  }

  ingress {
    description = "Grafana"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Acceso web
  }

  ingress {
    description = "Prometheus scraping from VPC"
    from_port   = 9090
    to_port     = 9100
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "monitoring-sg"
    Project = "lab-8-ec2"
  }
}

# Local: mapeo de instancias a security groups
locals {
  instance_sg_mapping = {
    "EC-Bastion"           = length(aws_security_group.bastion_sg) > 0 ? [aws_security_group.bastion_sg[0].id] : []
    "EC2-Frontend"         = length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : []
    "EC2-API-Gateway"      = length(aws_security_group.api_gateway_sg) > 0 ? [aws_security_group.api_gateway_sg[0].id] : []
    "EC2-Reportes"         = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
    "EC2-CORE"             = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
    "EC2-Monitoring"       = length(aws_security_group.monitoring_sg) > 0 ? [aws_security_group.monitoring_sg[0].id] : []
    "EC2-Messaging"        = length(aws_security_group.messaging_sg) > 0 ? [aws_security_group.messaging_sg[0].id] : []
    "EC2-Notificaciones"   = length(aws_security_group.microservices_sg) > 0 ? [aws_security_group.microservices_sg[0].id] : []
    "EC2-DB"               = length(aws_security_group.database_sg) > 0 ? [aws_security_group.database_sg[0].id] : []
  }
}

# User Data (Ubuntu + docker)
locals {
  # Default user data: start simple health server for general instances
  user_data_default = <<EOF
#!/bin/bash
set -euxo pipefail

apt update -y
apt install -y docker.io python3
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# Simple health HTTP server on port 80 for ALB checks
cat >/opt/health_server.py <<'PY'
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
  def do_GET(self):
    if self.path in ['/', '/health']:
      self.send_response(200)
      self.send_header('Content-Type', 'application/json')
      self.end_headers()
      self.wfile.write(b'{"status":"ok"}')
    else:
      self.send_response(404)
      self.end_headers()

def run():
  server = HTTPServer(('0.0.0.0', 80), Handler)
  server.serve_forever()

if __name__ == '__main__':
  run()
PY

cat >/etc/systemd/system/health-server.service <<'UNIT'
[Unit]
Description=Simple Health HTTP Server
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/health_server.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now health-server
echo "REV=20260121-default" > /opt/health_rev
EOF

  # API Gateway-specific user data: install Node, pm2, Docker, Mongo, clone repo and start services
  user_data_gateway = <<EOF
#!/bin/bash
set -euxo pipefail

apt update -y
apt install -y docker.io docker-compose-plugin python3 curl ca-certificates gnupg git unzip
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# Simple health server to serve / and /health on port 80 (parallel to gateway)
cat >/opt/health_server.py <<'PY'
import http.client
import socket
import os
import mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer

# Minimal proxying health server: serves '/' and '/health' locally,
# serves static files for '/app' from a local directory, and proxies
# everything else to API Gateway at 127.0.0.1:8080
STATIC_BASES = [
  '/opt/Proyecto-Acompa-amiento-/apps/frontend-web/public',
  '/var/www/html'
]

class Handler(BaseHTTPRequestHandler):
  protocol_version = 'HTTP/1.1'

  def _send_json(self, code, payload):
    body = payload.encode('utf-8')
    self.send_response(code)
    self.send_header('Content-Type', 'application/json')
    self.send_header('Content-Length', str(len(body)))
    self.end_headers()
    self.wfile.write(body)

  def _serve_static(self):
    base = next((b for b in STATIC_BASES if os.path.isdir(b)), None)
    if not base:
      return self._send_json(503, '{"error":"static_unavailable"}')

    # Map /app(/path) to files under base
    rel = self.path[4:] if self.path.startswith('/app') else self.path
    rel = rel.lstrip('/')
    if rel == '' or rel == 'app' or rel == 'app/':
      rel = 'index.html'
    path = os.path.join(base, rel.replace('app/', ''))

    if not os.path.isfile(path):
      # Fallback to index.html for client-side routing
      path = os.path.join(base, 'index.html')

    try:
      with open(path, 'rb') as f:
        data = f.read()
      ctype = mimetypes.guess_type(path)[0] or 'text/html'
      self.send_response(200)
      self.send_header('Content-Type', ctype)
      self.send_header('Content-Length', str(len(data)))
      self.end_headers()
      self.wfile.write(data)
    except Exception as e:
      return self._send_json(500, '{"error":"static_error","message":"' + str(e).replace('"','') + '"}')

  def do_GET(self):
    # Health endpoint
    if self.path == '/health':
      return self._send_json(200, '{"status":"ok"}')
    # Serve frontend index.html at root
    if self.path == '/':
      return self._serve_static()
    # Serve static for /app and common root-relative asset paths
    static_prefixes = ('/app', '/css/', '/js/', '/assets/', '/static/', '/images/', '/img/', '/fonts/', '/media/')
    static_exts = ('.css', '.js', '.mjs', '.map', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.gif', '.ttf', '.woff', '.woff2')
    if self.path.startswith(static_prefixes) or any(self.path.endswith(ext) for ext in static_exts):
      return self._serve_static()
    return self._proxy()

  def do_POST(self):
    return self._proxy()

  def do_PUT(self):
    return self._proxy()

  def do_DELETE(self):
    return self._proxy()

  def do_OPTIONS(self):
    return self._proxy()

  def _proxy(self):
    try:
      # Read request body if any
      content_length = int(self.headers.get('Content-Length', 0))
      body = self.rfile.read(content_length) if content_length > 0 else None

      # Forward to local API Gateway
      conn = http.client.HTTPConnection('127.0.0.1', 8080, timeout=10)
      path = self.path
      headers = {k: v for k, v in self.headers.items()}
      # Ensure Host header matches upstream
      headers['Host'] = '127.0.0.1:8080'
      conn.request(self.command, path, body=body, headers=headers)
      resp = conn.getresponse()

      # Relay response headers and body
      self.send_response(resp.status)
      for k, v in resp.getheaders():
        # Avoid hop-by-hop headers issues
        if k.lower() not in ['transfer-encoding', 'connection']:
          self.send_header(k, v)
      data = resp.read()
      self.send_header('Content-Length', str(len(data)))
      self.end_headers()
      self.wfile.write(data)
      conn.close()
    except Exception as e:
      return self._send_json(502, '{"error":"gateway_unavailable","message":"' + str(e).replace('"','') + '"}')

def run():
  server = HTTPServer(('0.0.0.0', 80), Handler)
  server.serve_forever()

if __name__ == '__main__':
  run()
PY

cat >/etc/systemd/system/health-server.service <<'UNIT'
[Unit]
Description=Simple Health HTTP Server
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/health_server.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now health-server

# Note: iptables redirect 80→8080 removed; Python health server proxies

# Minimal static UI placeholder to avoid 404 on /app while repo boots
mkdir -p /var/www/html
cat >/var/www/html/index.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proyecto Acompañamiento</title>
  <style>
    body { font-family: system-ui, Arial; margin: 2rem; }
    code { background:#f5f5f7; padding:2px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <h1>API Gateway operativo</h1>
  <p>Frontend aún inicializando. Si ves esto, el ALB está alcanzando el Gateway.</p>
  <ul>
    <li>Health: <a href="/health">/health</a></li>
    <li>App: <a href="/app">/app</a> (servirá assets cuando terminen de instalarse)</li>
  </ul>
  <script>
    fetch('/api/auth/health').then(r=>r.json()).then(j=>console.log('auth health',j)).catch(console.warn);
  </script>
</body>
</html>
HTML

# Clone application repository
rm -rf /opt/Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git /opt/Proyecto-Acompa-amiento-

# Build and start required containers with Docker Compose
cd /opt/Proyecto-Acompa-amiento-

# Ensure compose is available
docker compose version || true

# Bring up core dependencies and microservices
docker compose up -d zookeeper kafka rabbitmq mongo micro-auth micro-estudiantes api-gateway

# Verify containers
sleep 5
docker ps --format '{{.Names}}\t{{.Status}}' || true

echo "REV=20260121-gateway" > /opt/health_rev
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
  vpc_security_group_ids = var.existing_security_group_id != "" ? [var.existing_security_group_id] : (
    length(local.instance_sg_mapping[each.key]) > 0 ? local.instance_sg_mapping[each.key] : 
    (length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : [])
  )
  associate_public_ip_address = true
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
    length(aws_security_group.web_sg) > 0 ? [aws_security_group.web_sg[0].id] : [],
    length(aws_security_group.api_gateway_sg) > 0 ? [aws_security_group.api_gateway_sg[0].id] : []
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
