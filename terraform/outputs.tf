
output "ec2_instance_ids" {
  description = "IDs de las 10 instancias EC2 fijas"
  value = { for name, inst in aws_instance.fixed : name => inst.id }
}

output "ec2_public_ips" {
  description = "IPs públicas de las 10 instancias EC2"
  value = { for name, inst in aws_instance.fixed : name => inst.public_ip }
}

output "ec2_private_ips" {
  description = "IPs privadas de las 10 instancias EC2"
  value = { for name, inst in aws_instance.fixed : name => inst.private_ip }
}
output "alb_dns_name" {
  description = "DNS name del Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN del Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN del Target Group web"
  value       = aws_lb_target_group.web.arn
}