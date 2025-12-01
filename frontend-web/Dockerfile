# Simple static server for the frontend using nginx
FROM nginx:stable-alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy frontend static files
COPY ./public /usr/share/nginx/html

# Expose default nginx port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
