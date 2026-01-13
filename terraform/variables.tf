variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "proyecto-acompanamiento"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "VPC ID where instances are located"
  type        = string
  default     = "vpc-083e8d854f2c9fbfd"
}

variable "security_group_id" {
  description = "Security group ID for instances"
  type        = string
  default     = "sg-03af810d8f419b171"
}

variable "instance_ids" {
  description = "List of EC2 instance IDs"
  type        = list(string)
  default = [
    "i-0413c190dbf686769",   # EC2-Messaging
    "i-0bd13b8e83e8679bb",   # EC2-Bastion
    "i-00a121b00e2e8aa55",   # EC2-Frontend
    "i-01fb14943445a6820",   # EC2-API-Gateway
    "i-0cbed7ea84129a7ca",   # EC2-Reportes
    "i-0cb7fc180ec736b7a",   # EC2-CORE
    "i-0e4141c9befb46701",   # EC2-Notificaciones
    "i-02bd21ddcacaae221",   # EC2-Monitoring
    "i-091730b9034fc8b71"    # EC2-DB
  ]
}

variable "subnet_ids" {
  description = "List of subnet IDs for ALB"
  type        = list(string)
  default = [
    "subnet-0a2c1b8f9e3d4c5a6",   # us-east-1b
    "subnet-0b3d4c5a6e7f8g9h0"    # us-east-1f
  ]
}

variable "create_load_balancer" {
  description = "Whether to create the load balancer"
  type        = bool
  default     = true
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on ALB"
  type        = bool
  default     = false
}

variable "enable_http2" {
  description = "Enable HTTP/2"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply"
  type        = map(string)
  default     = {}
}
