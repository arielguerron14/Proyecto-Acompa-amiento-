#!/bin/sh
set -e

# Use provided API_GATEWAY_URL or construct from API_GATEWAY_HOST
API_GATEWAY_HOST="${API_GATEWAY_HOST:-172.31.78.183}"
API_GATEWAY_URL="${API_GATEWAY_URL:-http://${API_GATEWAY_HOST}:8080}"

echo "🔧 API_GATEWAY_HOST: $API_GATEWAY_HOST"
echo "🔧 API_GATEWAY_URL: $API_GATEWAY_URL"

# Substitute environment variables in the nginx config template using sed
sed "s|\${API_GATEWAY_HOST}|$API_GATEWAY_HOST|g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Inject API_GATEWAY_URL into all HTML files as a window variable
# This allows JavaScript to know the correct API Gateway URL
for html_file in /usr/share/nginx/html/*.html; do
  if [ -f "$html_file" ]; then
    # Check if script tag already exists (to avoid duplicates)
    if ! grep -q "window.__API_GATEWAY_URL__" "$html_file"; then
      # Insert script right after <head> tag
      sed -i "s|</head>|<script>window.__API_GATEWAY_URL__ = '${API_GATEWAY_URL}';</script></head>|" "$html_file"
      echo "✅ Injected API_GATEWAY_URL into $(basename "$html_file")"
    fi
  fi
done

# Start nginx
exec nginx -g "daemon off;"
