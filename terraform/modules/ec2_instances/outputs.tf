output "instance_ids" {
  description = "List of instance IDs"
  value       = aws_instance.instances[*].id
}

output "instance_private_ips" {
  description = "List of instance private IPs"
  value       = aws_instance.instances[*].private_ip
}

output "instance_public_ips" {
  description = "List of instance public IPs"
  value       = aws_instance.instances[*].public_ip
}

output "target_group_attachment_ids" {
  description = "Target group attachment IDs"
  value       = aws_lb_target_group_attachment.instance_attachment[*].id
}
