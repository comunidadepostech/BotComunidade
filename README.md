<img src="/data/postech.png"/>

# Bot Comunidade Pos Tech

Este é um bot Discord desenvolvido para gerir comunidades com funcionalidades úteis e comandos administrativos que visam otimizar e contribuir com determinadas tarefas da equipe.

# Sumário
- [Como instalar e executar](#como-instalar-e-executar-serviço-interno)
- [Comandos Disponíveis](#comandos-disponíveis)
  - [/invite](#invite)
  - [/ping](#ping)
  - [/echo](#echo)
  - [/display](#display)
  - [/poll](#poll)
  - [/createclass](#createclass)
  - [/extract](#extract)
  - [/event](#event)
- [Funcionalidades Automáticas](#funcionalidades-automáticas)
  - [Mensagens de Boas-Vindas](#sistema-de-boas-vindas)
  - [Armazenamento de enquetes](#atualização-constante-de-invites)
  - [Atualização constante de invites](#atualização-constante-de-invites)
  - [Criação de invites diretamente no comando /createclass](#criação-de-invites-diretamente-no-comando-createclass)
- [Progresso de desenvolvimento e atualizações](#progresso-de-desenvolvimento-e-atualizações)
- [Requisição de pull request na branch Stable](#requisição-de-pull-request-na-branch-stable)

## Como instalar e executar (serviço interno)
1. Certifique-se de que o Bot tenha as permissões necessárias no servidor (o cargo deve estar apenas embaixo do cargo admin ou Community Managers)
2. O Bot precisa de acesso ao banco de dados para funcionar corretamente.
3. Configure o Github Actions para fazer o deploy do Bot usando a conexão com chave SSH da AWS EC2. ou pule para o passo 4.
4. Crie a imagem usando `docker-compose up --build -d --remove-orphans` (AWS linux) ou inicie o bot com  `npm install && node .` ou `npm install && nvm run 20 .` (recomendado se for localmente)
5. Crie e configure um arquivo .env na raiz do projeto com as seguintes variáveis de ambiente:
```
EVENT_CHECK_TIME="1" #padrão 
EVENT_DIFF_FOR_WARNING="30" #padrão 
PRIMARY_WEBHOOK_PORT="9999" #padrão 
ID="" #ID do bot
MAX_CONCURRENT="1" #padrão 
MAX_EVENTS_CACHE="300" #padrão 
MYSQL_ROOT_PASSWORD=""
MYSQLDATABASE=""
MYSQLHOST=""
MYSQLPASSWORD=""
MYSQLPORT=""
MYSQLUSER=""
PUBLIC_KEY="" #Chave pública do bot
TOKEN="" #Token do bot
```

## Comandos Disponíveis

### `/invite`
Cria um convite personalizado para o servidor que pode ser vinculado a um cargo específico.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Parâmetros**:
- `channel` (obrigatório): Canal onde o convite será criado
- `role` (obrigatório): Cargo que será atribuído automaticamente aos novos membros que entrarem usando este convite

**Exemplo de uso**: /invite ``channel: #geral`` ``role: @Membro``


### `/ping`
Comando simples para verificar se o bot está a responder.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Exemplo de uso**: /ping

O bot responderá com "pong!" para confirmar que está funcionando.


### `/echo`
Replica uma mensagem para um canal.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Parâmetros**:
- `channel` (obrigatório): Canal onde a mensagem será enviada
- `message` (obrigatório): Conteúdo da mensagem que será replicada

**Exemplo de uso**: /echo ``channel: #anúncios`` ``message: Olá a todos! Bem-vindos ao servidor!``


### `/display`
Mostra todos os convites ativos do servidor, incluindo detalhes como canal, cargo vinculado, duração e usos restantes.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Exemplo de uso**: /display


### `/poll`
Cria uma enquete interativa com opções de votação personalizadas.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Parâmetros**:
- `question` (obrigatório): A pergunta principal da enquete
- `duration` (opcional): Tempo que a enquete ficará ativa (em horas, padrão: 24 horas)
- `option1` (obrigatório): Primeira opção de voto
- `option2` (obrigatório): Segunda opção de voto
- ...
- `option10` (opcional): Décima opção de voto
- `multiple` (opcional): Se definido como `Sim`, permite que os usuários votem em várias opções (padrão: `false`)

**Exemplo de uso**: /poll `question: Qual seu dia preferido para eventos?` `duration: 1` `option1: Sábado` ``option2: Domingo`` `allow-multiselect: Sim`


### `/createclass`
Cria cargo, categoria, canais e configura as permissões para uma nova turma com um link de convite

Funciona apenas para servidores comuns, não pode ser usado para servidores com fontes diferentes (Ex: servidor de egressos).

> **Atenção! Para atualizar as funcionalidades de canais, permissões, threads automáticas e quaisquer configurações relacionadas ao formato de criação, deve ser feito uma alteração hard-coded (deve ser implementado uma atualização para isso no futuro), portanto se for necessario qualquer alteração deve-se primeiro contatar o dev responsavel pela manutenção do código.**

**Permissão necessária**: Administrador

**Parâmetros**:
- `name` (obrigatório): o nome (sigla) da nova turma (Ex: 1TESTE)
- `faq-channel` (obrigatório apenas para turmas): Menção do canal de faq que a nova turma deve seguir (Ex: `#faq-2025`)

**Exemplos de uso**: 
- /createclass `type: Turma` `name: 1TESTE` `faq-channel: #faq-2025`


### `/extract`
Extrai o histórico de mensagens de um canal para um arquivo de texto.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Exemplos de uso**:
- /extract


### `/event`
Cria um evento no servidor.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Parâmetros**:
- `topic` (obrigatório): Tópico do evento
- `date` (obrigatório): Data do evento (formato: YYYY-MM-DD)
- `time` (obrigatório): Hora do evento (formato: HH:MM, 24 horas)
- `description` (obrigatório): Descrição do evento (dica: use \n para pular linhas)
- `link` (obrigatório): Link relacionado ao evento (Ex: link de reunião)
- `background` (obrigatório): Imagem de fundo para o evento (anexo)

**Exemplos de uso**:
- /event ``topic: aula`` ``date: 2025-11-01`` ``time: 20:00`` ``description: descrição`` ``link: https://teste.com`` ``background: [imagem de fundo]``

## Funcionalidades Automáticas

### Mensagens de Boas-Vindas
O bot automaticamente:
- Envia uma mensagem de boas-vindas no canal `#✨│boas-vindas` quando um novo membro entra
<!-- - Atribui automaticamente o cargo vinculado ao convite usado pelo novo membro 

### Armazenamento de enquetes
- Gerencia votos de enquetes criadas, permitindo que os usuários votem e visualizem resultados em tempo real.
- Gerencia multiplos votos ao mesmo tempo, usando um sistema de fila para garantir que os votos sejam contabilizados corretamente.

### Atualização constante de invites
- Confere se invites antigos ainda existem dentro do servidor e atualiza o banco de dados para economizar espaço
-->
### Criação de invites diretamente no comando `/createclass`
- Cria um convite para cada turma nova que já é vinculado ao novo cargo da turma e ao canal de FAQ correspondente do comando.

### Cadastro de eventos através com Webhook
- O Bot pode cadastrar eventos automaticamente com uma integração de um Webhook que se mantem numa aplicação [n8n](https://n8n.io) mas também é possível cadastrar evento usando apenas HTTP POST com os parametros certos.

## Progresso de desenvolvimento e atualizações
Para saber em detalhes o andamento do desenvolvimento acompanhe a aba de projetos e veja os commits da branch `experimental`.

## Requisição de pull request na branch `stable`
- Deve-se sempre testar o código por completo antes de fazer a requisição
- Nunca dê um commit na branch `stable` se não for algo extremamente urgente ou um erro despercebido
- Sempre utilize primeiro a branch `experimental` para fazer testes e implementar novas funcionalidades e atualizações e apenas após completas e testadas que se deve fazer o Pull Request