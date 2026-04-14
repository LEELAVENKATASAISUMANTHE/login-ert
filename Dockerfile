FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Create uploads directory
RUN mkdir -p /tmp/uploads

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port 3225
EXPOSE 3225

# Start the app
CMD ["npm", "start"]
