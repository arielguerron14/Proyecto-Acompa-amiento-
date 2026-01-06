#!/bin/sh
set -e

# Use provided API_GATEWAY_HOST or default
API_GATEWAY_HOST="${API_GATEWAY_HOST:-172.31.78.183}"

# Substitute environment variables in the nginx config template
envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
