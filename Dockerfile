FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN mkdir -p /tmp/uploads && chown -R appuser:appgroup /tmp/uploads

COPY --chown=appuser:appgroup package*.json ./

USER appuser

RUN npm ci --only=production

COPY --chown=appuser:appgroup . .

EXPOSE 3225

CMD ["npm", "start"]