# Stage 1: Dependências
FROM oven/bun:1.4.2 AS deps
WORKDIR /app

# Copia os manifestos (suporta bun.lock e bun.lockb)
COPY package.json bun.lock* ./

# Instala apenas dependências de produção usando cache do BuildKit
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# Stage 2: Execução final
FROM oven/bun:1.4.2 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Banco do modo SLIM (SLIM=true): fica dentro do volume /data para sobreviver a reinicios do container
ENV SQLITE_PATH=/data/slim.sqlite

# Copia dependências instaladas do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia os arquivos do projeto com permissão para o usuário não-root 'bun'
COPY --chown=bun:bun . .

# Prepara o diretório do volume com permissões corretas antes de declarar o VOLUME
RUN mkdir -p /data && chown bun:bun /data

VOLUME [ "/data" ]

#USER bun
EXPOSE 9996

CMD [ "bun", "run", "start" ]