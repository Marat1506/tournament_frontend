FROM node:24-alpine AS builder

WORKDIR /app

ARG NUXT_PUBLIC_API_BASE=http://localhost:8080
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE

COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

COPY . .
RUN npm run postinstall
RUN npm run build

FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
