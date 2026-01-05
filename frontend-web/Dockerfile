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

# Expose port
EXPOSE 80

# Set API Gateway URL environment variable
ENV API_GATEWAY_URL=http://100.48.66.29:8080

# Start the development server
CMD ["npm", "start"]
