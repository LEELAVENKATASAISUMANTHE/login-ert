FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 🔥 Fix: give ownership of entire /app
RUN chown -R appuser:appgroup /app

# uploads folder
RUN mkdir -p /tmp/uploads && chown -R appuser:appgroup /tmp/uploads

# copy package files
COPY --chown=appuser:appgroup package*.json ./

# switch user
USER appuser

# install deps
RUN npm ci --only=production

# copy source
COPY --chown=appuser:appgroup . .

EXPOSE 3225

CMD ["npm", "start"]