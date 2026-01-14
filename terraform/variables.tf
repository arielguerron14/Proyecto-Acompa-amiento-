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
	default     = "t3.micro"
}

variable "ssh_key_name" {
	description = "Name of the SSH key pair to attach (empty = none)"
	type        = string
	default     = ""
}

