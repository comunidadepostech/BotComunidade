FROM oven/bun:canary-alpine
WORKDIR /bot
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .