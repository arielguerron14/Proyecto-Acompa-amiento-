# Infrastructure Outputs

output "infrastructure_status" {
  description = "Status of deployed infrastructure"
  value = {
    load_balancer_dns = module.load_balancer.alb_dns_name
    load_balancer_arn = module.load_balancer.alb_arn
    registered_instances_count = length(data.aws_instances.all.ids)
    instance_ids = data.aws_instances.all.ids
    private_ips  = data.aws_instances.all.private_ips
    vpc_id       = var.vpc_id
    security_group_id = var.security_group_id
  }
}
