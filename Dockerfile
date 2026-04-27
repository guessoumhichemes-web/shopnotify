# Use Node.js 20 official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Railway will override this)
EXPOSE 3000

# Set environment
ENV NODE_ENV production

# Start application
CMD ["npm", "start"]
