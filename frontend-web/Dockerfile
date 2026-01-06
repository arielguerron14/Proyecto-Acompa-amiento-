FROM nginx:alpine

# Copy frontend files to nginx
COPY frontend-web/public /usr/share/nginx/html/
COPY frontend-web/index.html /usr/share/nginx/html/
COPY frontend-web/*.html /usr/share/nginx/html/

# Create nginx config for SPA routing
RUN echo 'server { listen 3000; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
