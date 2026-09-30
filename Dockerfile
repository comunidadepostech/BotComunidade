# Stage 1: Dependências
FROM oven/bun:1.4.2 AS deps
WORKDIR /app

# Copia os manifestos (suporta bun.lock e bun.lockb)
COPY package.json bun.lock* ./

# Instala apenas dependências de produção usando cache do BuildKit
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache bun install --frozen-lockfile --production

# Stage 2: Execução final
FROM oven/bun:1.4.2 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV SQLITE_PATH=/data/slim.sqlite

# Prepara o diretório de dados para o SQLite
RUN mkdir -p /data && chown -R bun:bun /data /app

# Copia os arquivos do código-fonte primeiro
COPY --chown=bun:bun . .

# Copia dependências limpas do stage anterior (sobrepõe qualquer node_modules local)
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules

# Executa a aplicação como usuário não-root por segurança
USER bun
EXPOSE 9996

CMD [ "bun", "run", "start" ]