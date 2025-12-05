FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port 3225
EXPOSE 3225

# Start the app
CMD ["npm", "start"]