FROM nginx:alpine

# Copy frontend files to nginx (paths are relative to build context `./frontend-web`)
COPY public /usr/share/nginx/html/

# Create a template nginx config that will be processed at runtime
RUN printf 'server {\n  listen 5500;\n  root /usr/share/nginx/html;\n  index index.html;\n  \n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}' > /etc/nginx/conf.d/default.conf

EXPOSE 5500

CMD ["nginx", "-g", "daemon off;"]
