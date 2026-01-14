
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
