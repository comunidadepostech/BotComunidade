# Build
FROM oven/bun
WORKDIR /bot
COPY package.json package-lock.json ./
RUN bun install
COPY . .