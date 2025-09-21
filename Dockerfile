# Dockerfile sencillo para NestJS
FROM node:20-alpine

WORKDIR /app

# Copiá solo manifests primero (cache de npm)
COPY package.json package-lock.json* ./

# Instalá dependencias
RUN npm ci

# Copiá el resto y compilá
COPY . .
RUN npm run build

# Dejá solo deps de runtime para achicar un poco
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
