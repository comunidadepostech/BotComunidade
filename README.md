# Bot Comunidade Pos Tech

Um bot criado para ajudar a equipe de CMs da Pos Tech a executar tarefas comuns e rotineiras no Discord.

# Configurando o bot

## Variáveis de ambiente

Antes de iniciar o Bot, certifique-se de configurar as variáveis de ambiente necessárias no arquivo `.env` usando o arquivo `.env.example` como referência.

## Configurando servidores

Para garantir que o Bot funcione como esperado é de extrema importência que você configure os servidores no banco de dados corretamente, o bot automaticamente detecta quando está em servidores novos e adiciona o ID do servidor ao banco de dados mas você deve adicionar manualmente a sigla (Ex: ADJT) e os clusters daquele servidor separado por ", ".

# Executando o projeto

## Produção

### 1. Instala dependências do projeto

`bun i -p --frozen-lockfile`

### 2. Aplica as migrações SQL pendentes no banco de dados de PROD

`bunx prisma migrate deploy`

### 3. Gera o Prisma Client com os tipos/métodos atualizados

`bunx prisma generate`

### 4. Inicia a aplicação

`bun start`

## Desenvolvimento

### 1. Instala dependências do projeto

`bun i -d --frozen-lockfile`

### 2. Aplica as migrações SQL pendentes no banco de dados de DEV

`bunx prisma migrate dev`

### 3. Gera o Prisma Client com os tipos/métodos atualizados

`bunx prisma generate`

### 4. Inicia a aplicação

`bun dev`

# Progresso de desenvolvimento atual

- [x] inicialização
  - [x] verificação dos comandos (hash e se diferente cadastrar novamente)
  - [x] registro dos eventos
  - [x] criação do webhook
- [x] comandos
  - [x] createClass
  - [x] echo
  - [x] edit
  - [x] endPoll
  - [x] event
  - [x] exec
  - [x] getPollHash
  - [x] help
  - [x] ping
  - [x] poll
  - [x] flags
  - [x] invite
- [x] eventos
  - [x] clientReady
  - [x] error
  - [x] guildCreate
  - [x] guildDelete
  - [x] guildMemberAdd
  - [x] interactionCreate
  - [x] messageCreate
  - [x] messageUpdate (poll)
- [] Webhook
  - [x] Criação de evento
  - [] remoção de evento
  - [x] Envio de enquete de live
  - [x] Envio de mensagem programada
  - [x] Envio de vagas
- [x] N8N
  - [x] salvamento de interações (mensagens)
  - [x] salvamento de enquetes
- [x] Scheduler
  - [x] verificação de eventos
  - [x] contagem de membros mensal
  - [x] exclusão de avisos
  - [x] limpeza de cache de eventos
  - [x] contagem de membros a cada 15 minutos

# Desenvolvimento

## Informações gerais

A Branch principal do projeto é a `main`, ela é bloqueada para aceitar pushes diretos a partir da versão v3, todas as alterações devem ser feitas em branches separadas e depois mescladas na `main` (Ex: feat/invite-command). 

Para lançar atualizações basta abrir um Pull Request e de preferência garantir que o merge não criará commits novos (use --ff-only no merge) e delete a branch após o merge. As versões são contabilizadas automaticamente pelo (workflow de release)[.github/workflows/release.yml] então apenas certifique-se de nomear os commits com feat, fix, chore, e etc ((dica)[https://gist.github.com/johnstew/941676d525271359a4b2d7f1bf2cb421]).

Você também pode criar Feature Flags usando a constante (DEFAULT_FEATURE_FLAGS)[src/utils/constants/flagsConstants.ts], ela é sincronizada automaticamente no banco de dados e pode ter seu valor atualizado por servidor usando o comando (/flags)[src/controllers/discord/commands/flags.command.ts].

## Adicionando novos comandos

Para adicionar um novo comando, crie uma nova classe que implemente as interfaces `ICommand` e `IController` e adicione-a à lista de comandos no `index.ts`. Essas classes se comportam como um controller e devem chamar o service correspondente que por sua vez deve primeiro ser declarado em src/types/services antes da implementação.

Os comandos são atualizados no Discord conforme ocorre atualizações no `build()`, se não houver atualizações então ele se mantem o mesmo após reiniciar ou atualizar a instância.

## Adicionando novos eventos (do Discord)

Para adicionar um novo evento, crie uma nova classe que implemente a interface `IController` e adicione-a à lista de eventos no `index.ts`. Essa terá o mesmo comportamento que os comandos citados acima com a única diferença de que ela não precisa implementar o `build()`.
