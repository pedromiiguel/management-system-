# Build a partir da raiz do monorepo:
#   docker build -f apps/api/Dockerfile -t beverage-api .
FROM node:22-alpine
WORKDIR /app

# Precisa da árvore completa do monorepo (workspaces) presente antes do
# npm ci — copiar só os manifests primeiro quebra a resolução de tipos
# do TypeScript (zod) durante o build do pacote shared.
COPY . .
RUN npm ci
RUN npm run build --workspace packages/shared
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build --workspace apps/api

ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
