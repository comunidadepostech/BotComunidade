FROM oven/bun:canary-alpine
WORKDIR /bot
RUN chown bun:bun /bot
USER bun:bun
COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY --chown=bun:bun . .