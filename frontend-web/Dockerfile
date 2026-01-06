# Development server using Node.js
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only frontend-web files (when building from repo root context)
COPY frontend-web/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend-web source code
COPY frontend-web/ .

# Copy entrypoint script
COPY frontend-web/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 80

# Set API Gateway URL environment variable
ENV API_GATEWAY_URL=http://52.71.188.181:8080
ENV NODE_ENV=production
ENV PORT=3000

# Start the development server
WORKDIR /app
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
