variable "region" {
	description = "AWS region to deploy into"
	type        = string
	default     = "us-east-1"
}

variable "vpc_cidr" {
	description = "CIDR block for the VPC"
	type        = string
	default     = "10.0.0.0/16"
}

variable "public_subnets" {
	description = "List of public subnet CIDRs"
	type        = list(string)
	default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "instance_type" {
	description = "EC2 instance type"
	type        = string
	default     = "t3.small"
}

variable "ssh_key_name" {
	description = "Name of the SSH key pair to attach (empty = none)"
	type        = string
	default     = ""
}

variable "subnet_id" {
  description = "(Optional) Specific subnet id to use (e.g., a subnet in us-east-1f)"
  type        = string
  default     = ""
}

variable "eip_instances" {
  description = "List of instance names to assign Elastic IPs"
  type        = list(string)
  default     = []
} 

variable "ami_id" {
  description = "AMI ID to use (optional). If empty, a data lookup will be used."
  type        = string
  default     = "ami-0c19292331f6e3a5c"
}

variable "azs" {
  description = "List of AZ names to use (optional). If empty, a data lookup will be used."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "existing_vpc_id" {
  description = "(Optional) If provided, Terraform will use this VPC instead of creating a new one."
  type        = string
  default     = ""
}

variable "create_vpc" {
  description = "When true and existing_vpc_id is empty, Terraform will create a VPC. Default false for restricted lab environments."
  type        = bool
  default     = false
}

variable "existing_security_group_id" {
  description = "(Optional) If provided, Terraform will use this security group ID and will not attempt to create a security group."
  type        = string
  default     = ""
}

variable "create_security_group" {
  description = "When true and existing_security_group_id is empty, Terraform will create a security group. Default false for restricted lab environments."
  type        = bool
  default     = false
}

variable "create_instances" {
  description = "When true, Terraform will create EC2 instances. Default false to avoid RunInstances in restricted lab environments."
  type        = bool
  default     = false
}

