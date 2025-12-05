# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Copy PM2 config
COPY ecosystem.config.js ./

# Create logs directory
RUN mkdir -p logs

# Expose port 3001 (changed from 3000)
EXPOSE 3001

# Add healthcheck (updated port)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]