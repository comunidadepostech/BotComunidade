# Bot Comunidade Pos Tech

Um bot criado para ajudar a equipe de CMs da Pos Tech a executar tarefas comuns e rotineiras no Discord.

# Configurando o bot

## Variáveis de ambiente

Antes de iniciar o Bot, certifique-se de configurar as variáveis de ambiente necessárias no arquivo `.env` usando o arquivo `.env.example` como referência.

## Configurando servidores

Para garantir que o Bot funcione como esperado é de extrema importência que você configure os servidores no banco de dados corretamente, o bot automaticamente detecta quando está em servidores novos e adiciona o ID do servidor ao banco de dados mas você deve adicionar manualmente a sigla (Ex: ADJT) e os clusters daquele servidor separado por ", ".

## Modo SLIM

Com `SLIM=true` o bot roda em uma versão mínima, que não depende de nada externo além do Discord (sem PostgreSQL e sem n8n):

| | Normal | `SLIM=true` |
| --- | --- | --- |
| Servidores, feature flags, hashes dos comandos e avisos de eventos | PostgreSQL | SQLite local |
| Mensagens (`interactions`) e enquetes (`polls`) | PostgreSQL + n8n | não são salvas |
| Contagem de membros (`classes` e `online_members`) | PostgreSQL | não é salva |
| Telemetria para o n8n | enviada | não é enviada |
| `DATABASE_URL`, `N8N_ENDPOINT` e `N8N_WEBHOOKS_TOKEN` | obrigatórias | dispensadas (ignoradas se existirem) |

Variáveis:

- `SLIM` (opcional, `true` ou `false`, padrão `false`)
- `SQLITE_PATH` (opcional, só no modo SLIM): caminho do arquivo SQLite, padrão `./data/slim.sqlite` (`:memory:` não guarda nada entre reinícios). No Docker o padrão é `/data/slim.sqlite`, então monte um volume em `/data`.

Como funciona:

- O arquivo e as tabelas são criados sozinhos na primeira execução, não precisa rodar migrações.
- Na primeira execução o bot cadastra os servidores em que já está, com sigla e clusters vazios. Se você usa os webhooks por turma ou o envio por cluster, preencha e reinicie o bot (ele lê os servidores na inicialização): `sqlite3 data/slim.sqlite "UPDATE guilds SET guild_name = 'ADJT', clusters = 'cluster-a, cluster-b' WHERE guild_id = 'ID_DO_SERVIDOR'"`.
- Como nada é salvo, o bot nem escuta as mensagens e enquetes. As flags `salvar_interacoes`, `salvar_enquetes` e `coletar_dados_de_membros_mensalmente` ficam sem efeito, e as opções de contagem de membros do `/exec` não gravam nada.
- As tabelas do SQLite são criadas com `CREATE TABLE IF NOT EXISTS`, sem migrações. Ao alterar `src/db/sqlite.schema.ts`, atualize também o `SLIM_DDL` em `src/infrastructure/database/sqlite.client.ts`.
- `bun run test:slim` testa o modo SLIM (não precisa de Docker nem de banco).

# Executando o projeto

## Produção

### 1. Instala dependências do projeto

`bun i -p --frozen-lockfile`

### 2. Aplica as migrações pendentes no banco de dados de PROD

`bun run db:migrate`

### 3. Inicia a aplicação

`bun start`

# Desenvolvimento

## Configurando o projeto localmente

### 1. Instala dependências do projeto

`bun i -d --frozen-lockfile`

### 2. Sincroniza o banco de dados de DEV com o schema

`bunx drizzle-kit push`

### 3. Inicia a aplicação

`bun dev`

## Alterando o schema

O schema vive em `src/db/schema.ts` — é TypeScript comum, e é a mesma definição
que o runtime usa nas queries. O ciclo é:

1. Edita `src/db/schema.ts`
2. `bun run db:generate` — gera a migração SQL em `drizzle/` (o hook de pre-commit cobra isso)
3. `bunx drizzle-kit push` — aplica no banco de DEV
4. `bun run test:schema` — sobe um Postgres limpo em Docker, aplica o schema e roda um round-trip em cada repositório

O baseline `drizzle/0000_*.sql` veio do `drizzle-kit pull` e foi tornado idempotente
(`CREATE TABLE IF NOT EXISTS`): no banco de PROD, que já tinha as tabelas quando o
projeto adotou o Drizzle, ele não cria nada e apenas se registra como aplicado; num
banco vazio ele cria o schema inteiro. Os dois caminhos são cobertos pelo `test:schema`.

Comandos úteis: `bun run db:check` (consistência das migrações), `bunx drizzle-kit studio`.

## Informações gerais

A Branch principal do projeto é a `main`, ela é bloqueada para aceitar pushes diretos a partir da versão v3, todas as alterações devem ser feitas em branches separadas e depois mescladas na `main` (Ex: feat/invite-command). 

Para lançar atualizações basta abrir um Pull Request e de preferência garantir que o merge não criará commits novos (use --ff-only no merge) e delete a branch após o merge. As versões são contabilizadas automaticamente pelo [workflow de release](.github/workflows/release.yml) então apenas certifique-se de nomear os commits com feat, fix, chore, e etc ([dica](https://gist.github.com/johnstew/941676d525271359a4b2d7f1bf2cb421)).

Você também pode criar Feature Flags usando a constante [DEFAULT_FEATURE_FLAGS](src/utils/constants/flagsConstants.ts), ela é sincronizada automaticamente no banco de dados e pode ter seu valor atualizado por servidor usando o comando (/flags)[src/controllers/discord/commands/flags.command.ts].

## Adicionando novos comandos

Para adicionar um novo comando, crie uma nova classe que implemente as interfaces `ICommand` e `IController` e adicione-a à lista de comandos no `index.ts`. Essas classes se comportam como um controller e devem chamar o service correspondente que por sua vez deve primeiro ser declarado em src/types/services antes da implementação.

Os comandos são atualizados no Discord conforme ocorre atualizações no `build()`, se não houver atualizações então ele se mantem o mesmo após reiniciar ou atualizar a instância.

## Adicionando novos eventos (do Discord)

Para adicionar um novo evento, crie uma nova classe que implemente a interface `IController` e adicione-a à lista de eventos no `index.ts`. Essa terá o mesmo comportamento que os comandos citados acima com a única diferença de que ela não precisa implementar o `build()`.
