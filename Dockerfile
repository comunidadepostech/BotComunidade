# Build
FROM oven/bun
WORKDIR /bot
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .