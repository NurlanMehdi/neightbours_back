# Stage 1: Build Stage
FROM node:23 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

RUN mkdir -p /app/uploads && \
    chown -R node:node /app/uploads

# Stage 2: Production Stage
FROM node:23

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main"]
