# Development server using Node.js
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend-web/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 80

# Start the development server
CMD ["npm", "start"]
