# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS production
WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy and install server dependencies
COPY --from=builder /app/server ./server
WORKDIR /app/server
RUN npm ci --omit=dev

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
