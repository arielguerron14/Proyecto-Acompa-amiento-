# Development server using Node.js
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 80

# Set API Gateway URL environment variable
ENV API_GATEWAY_URL=http://100.48.66.29:8080

# Start the development server
CMD ["npm", "start"]
