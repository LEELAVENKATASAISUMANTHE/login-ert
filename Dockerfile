FROM node:20-alpine

WORKDIR /app

# Create user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create uploads directory (as root is fine)
RUN mkdir -p /tmp/uploads

# Copy package files with correct ownership
COPY --chown=appuser:appgroup package*.json ./

# Switch user
USER appuser

# Install dependencies
RUN npm install

# Copy rest of code with correct ownership
COPY --chown=appuser:appgroup . .

# Expose port
EXPOSE 3225

# Start app
CMD ["npm", "start"]