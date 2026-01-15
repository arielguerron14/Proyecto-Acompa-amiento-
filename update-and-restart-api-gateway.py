#!/usr/bin/env python3
import paramiko
import io
import time

SSH_KEY_CONTENT = """-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAwNZvdzm4oVXLj4H6MONFoJozy7e4IR6WKkzEQB7K6SaSoJJd
OlPdEXAkWK83TU+5PXWifOYGl7mVD++PvfFJiPLkCM3kxCzyVfZk/SW0okgdexjD
Hqj7THblmH/twsBA1h3hXEdrjlkLztA/sutUdQEngcpSKUrlKjlZy26C1BjChzIS
nDflHHBwuqWEJ9DjBemJ0yhsweexZh1R+yNfTkKTEsCZzsdYv4p07Ij9Grqa4oU3
wfrqN+mwpOGhoR4sX+BWw/Sr5aJ9SSXjjufH4R0kX0PXqLaKETdogyY82UjtxADn
z0jmChdSfULmbwVb8TveWPFQW7GsT6NUmchSHQIDAQABAoIBAQCtoSaSIl3Unox/
9ZdRZ4Gs3steVVisMX8iLSbTWSZ4kauaes8IkrRNXDzNwU45BVyUMxQQA4nSGV5X
D+vMKbJ9Zb3fE4w0+wdkUUuTB91B9U7eJGijdaF3suJ90kpBfZujbxoYXZJBhHn2
SFnifrP3+gcZfRNHbNE0mJj6a9HOp8BdMBmedcXR8QKn/ItHN9do8nF+9HYFMXMM
Q97qGRAS3OCNkhkacRMuXQBv+VHl/K8bq9gO8CayQ93yUm39MddRpVEv67nBEkdM
F3E8pzLkvpv0Om5WQCEQ1sbAV8P97FIrAgy+dhgxi8neNRhwoORVrqbhxyfvcl/u
J6gR4mhBAoGBAOOPWf7i+F6oAJ7E7nQ3q1YK/3E9vwIzR7Lvei+aj+TO85slOnDZ
4qWSf8KN16vusMuWZlakYzGG//RBBLblpcLmybNlXKbekqsUgv4YR6xVpiWrOCNl
+YPqucLCDfBCSzM/5Jmz3eEghwtmiDbHfjq5ybrTzvHCB0/JrZBkncetAoGBANjw
KcgPlVg8UAsvxz9Ut5WlCbqpXkVtS8OyoL47SLK3yg7PfudEi05cMbdreFVywlTG
+2otWB1UYyAj6hqkW0Tu/PyEQm9FBYU1HVpLQNphDRxfsJIneW590C+Rt9x2gSGw
Ry+neiPFu8R/JOTlPk1xeslzRw49KZXcTrN31MIxAoGAduAgJ2LyVKB3EnnWB6g9
PUmpf8K90axwPC2WKuAXY3QpFlcwXFu2ZsBNNZlbnVmnyfLbq09c8jaP500/5Tu6
iEKAA9Njv1huTij89ThB2Ok1TmBPh05yNlOcjv1IwsYe+rrZ9OFde4m+glohtlwo
uQztMUgMx4aQw0GcBd5J/lECgYBVKfM9FuEKQqMpwRf3RMrNdHzdSqA3oTCdIwL3
q05e2sf4CH1JTR9jI85gs1AKO4MOxQ7uH973pKlFdNPyoZMy/J9UgpeSFwaTxMZB
LEnJcVA0U1x+BAEn3zxbcFk9s0f+cbWAf77zTCzqdv+E3HoY7PPHIfpDHL+2lUZQ
LjrYAQKBgQDSI2N+Xqn7LHu5VfxiiDAGMJQyk/W3XNLOS+KKvpSN45JMX/YtZKI6
eupWWNpR71UITrPz+V6Se1bnu3ZU3tQpfGYjQLSGzdda8iecMgVpkHwa2gQqalCX
ZQ0T//skZFEaxod2MIoVK14xmksGh1NZymeXfKPrtek2lDHklB+AtQ==
-----END RSA PRIVATE KEY-----"""

API_GATEWAY_HOST = "52.7.168.4"
USER = "ubuntu"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
key = paramiko.RSAKey.from_private_key(io.StringIO(SSH_KEY_CONTENT))
ssh.connect(API_GATEWAY_HOST, username=USER, pkey=key, timeout=30)

print("📥 Pulling latest configuration...")
stdin, stdout, stderr = ssh.exec_command("cd ~/Proyecto-Acompa-amiento- && git pull")
print(stdout.read().decode())

print("\n🔄 Restarting API Gateway...")
cmd = """
cd ~/Proyecto-Acompa-amiento- && \
sudo docker-compose -f docker-compose.api-gateway.yml down && \
sleep 2 && \
sudo docker-compose -f docker-compose.api-gateway.yml up -d && \
sleep 5 && \
curl -s http://localhost:8080/health
"""
stdin, stdout, stderr = ssh.exec_command(cmd)
output = stdout.read().decode()
print(output)

ssh.close()
print("\n✅ API Gateway updated and restarted!")
