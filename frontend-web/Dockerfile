FROM nginx:alpine

# Copy frontend files to nginx
COPY frontend-web/public /usr/share/nginx/html/

# Create simple nginx config for port 3000 with SPA routing
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
