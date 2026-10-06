FROM node:20-alpine AS builder
WORKDIR /app
# Prisma engine trên alpine cần openssl
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
# Giữ node_modules từ builder: cần prisma CLI để migrate và ts-node để chạy seed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json tsconfig.json ./
EXPOSE 3001
# Chạy migration rồi seed dữ liệu mẫu trước khi start server
# dist/src/main vì prisma/seed.ts nằm ngoài src/ nên tsc giữ cấu trúc thư mục
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/main"]
