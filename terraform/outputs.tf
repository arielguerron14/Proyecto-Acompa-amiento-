# Infrastructure Outputs

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.load_balancer.alb_dns_name
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = module.load_balancer.alb_arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.load_balancer.target_group_arn
}

output "ec2_instance_ids" {
  description = "List of created EC2 instance IDs"
  value       = module.ec2_instances.instance_ids
}

output "ec2_private_ips" {
  description = "List of instance private IPs"
  value       = module.ec2_instances.instance_private_ips
}

output "ec2_public_ips" {
  description = "List of instance public IPs"
  value       = module.ec2_instances.instance_public_ips
}

output "infrastructure_status" {
  description = "Status of deployed infrastructure"
  value = {
    load_balancer_dns     = module.load_balancer.alb_dns_name
    load_balancer_arn     = module.load_balancer.alb_arn
    ec2_instances         = module.ec2_instances.instance_ids
    registered_instances  = length(module.ec2_instances.instance_ids)
    vpc_id                = var.vpc_id
    security_group_id     = var.security_group_id
  }
}
