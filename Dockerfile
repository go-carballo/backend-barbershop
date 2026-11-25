# =========================================================
# Dev stage – hot-reload con volúmenes mounteados
# =========================================================
FROM node:22-alpine AS dev

WORKDIR /app

# Instalar dependencias de build y dev
COPY package.json package-lock.json ./
RUN npm ci

# Copiar fuente completa
COPY . .

EXPOSE 3000

# NestJS dev con watch mode
CMD ["npm", "run", "start:dev"]

# ---- Production stage – multi-stage build ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ src/
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]