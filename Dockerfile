FROM node:22-alpine AS setup
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=8080

RUN corepack enable

RUN apk update && apk upgrade --no-interactive

FROM setup AS base

FROM base AS builder

COPY . /app

WORKDIR /app/frontend

RUN pnpm install && pnpm build && mv dist /app/backend/dist

WORKDIR /app/backend

RUN pnpm install && npm rebuild bcrypt && pnpm build

FROM base AS prod

WORKDIR /app/backend

COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --prod bcrypt && npm rebuild bcrypt

COPY --from=builder /app/backend/dist ./dist

EXPOSE 8080

CMD ["node", "dist/app.bundle.js"]