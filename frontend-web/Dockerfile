FROM nginx:alpine

# Copy frontend files to nginx
COPY frontend-web/public /usr/share/nginx/html/

# Create a template nginx config that will be processed at runtime
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  index index.html;\n  \n  location /api/ {\n    proxy_pass http://${API_GATEWAY_HOST}:8080;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection '\''upgrade'\'';\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_cache_bypass $http_upgrade;\n  }\n  \n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}' > /etc/nginx/conf.d/default.conf.template

# Create entrypoint script to substitute env vars
RUN printf '\''#!/bin/sh\nset -e\nAPI_GATEWAY_HOST=${API_GATEWAY_HOST:-172.31.78.183}\nenvsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf\nexec nginx -g "daemon off;"\n'\'' > /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
