#!/bin/bash
# Quick fix to replace docker-compose with docker compose in deploy-ec2-db.sh

sed -i 's/docker-compose exec/docker compose exec/g' deploy-ec2-db.sh
sed -i 's/docker-compose ps/docker compose ps/g' deploy-ec2-db.sh
sed -i 's/ docker-compose / docker compose /g' deploy-ec2-db.sh

echo "✅ Deploy script updated to use 'docker compose' instead of 'docker-compose'"
