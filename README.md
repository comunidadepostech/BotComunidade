# Bot Comunidade Pos Tech

Este é um bot Discord desenvolvido para gerenciar comunidades com funcionalidades úteis como criação de convites personalizados, mensagens de boas-vindas e comandos administrativos que visam otimizar e contribuir com determinadas tarefas da equipe.

## Comandos Disponíveis


### `/invite`
Cria um convite personalizado para o servidor que pode ser vinculado a um cargo específico.

**Permissão necessária**: Administrador
**Parâmetros**:
- `channel` (obrigatório): Canal onde o convite será criado
- `role` (obrigatório): Cargo que será atribuído automaticamente aos novos membros que entrarem usando este convite
- `duration` (opcional): Duração do convite em dias (0 para permanente)
- `uses` (opcional): Número máximo de usos do convite (0 para ilimitado)

**Exemplo de uso**: /invite ``channel: #geral`` ``role: @Membro`` ``duration: 7`` ``uses: 10``


### `/ping`
Comando simples para verificar se o bot está respondendo.

**Permissão necessária**: Administrador

**Exemplo de uso**: /ping

O bot responderá com "pong!" para confirmar que está funcionando.


### `/echo` (atualmente em criação)
Replica uma mensagem para um ou mais canais.
**Permissão necessária**: Administrador
**Parâmetros**:
- `channel` (obrigatório): Canal onde a mensagem será enviada
- `message` (obrigatório): Conteúdo da mensagem que será replicada

**Exemplo de uso**: /echo ``channel: #anúncios`` ``message: Olá a todos! Bem-vindos ao servidor!``


### `/display` (atualmente em criação)
Mostra todos os convites ativos do servidor, incluindo detalhes como canal, cargo vinculado, duração e usos restantes.

**Exemplo de uso**: /display


### `/poll` (atualmente em criação)
Cria uma enquete interativa com opções de votação personalizadas.

**Parâmetros**:
- `title` (obrigatório): O título ou pergunta principal da enquete
- `description` (opcional): Uma descrição adicional para dar mais contexto à enquete
- `duration` (opcional): Tempo que a enquete ficará ativa (em horas, padrão: 24 horas)
- `option1` (obrigatório): Primeira opção de voto
- `option2` (obrigatório): Segunda opção de voto
- `option3` (opcional): Terceira opção de voto
- `option4` (opcional): Quarta opção de voto
- `option5` (opcional): Quinta opção de voto

**Exemplos de uso**: /poll `title: Qual seu dia preferido para eventos?` `option1: Sábado` ``option2: Domingo``


## Funcionalidades Automáticas

### Sistema de Boas-Vindas
O bot automaticamente:
1. Envia uma mensagem de boas-vindas no canal `#✨│boas-vindas` quando um novo membro entra
2. Atribui automaticamente o cargo vinculado ao convite usado pelo novo membro

## Requisitos Técnicos
- Node.js
- Pacotes necessários:
    - discord.js: 14.21.0
    - @discordjs/rest: 2.5.1
    - discord-api-types: 0.38.16
    - dotenv: 17.2.1
    - mysql2: 3.14.2

## Configuração
1. Certifique-se de que o bot tenha as permissões necessárias no servidor (o cargo deve estar apenas embaixo do cargo admin)
2. O bot precisa ter acesso ao canal de boas-vindas (`#✨│boas-vindas`)
3. Configure o arquivo `.env` com:
    - TOKEN: Token do seu bot Discord
    - ALLOWED_SERVERS_ID: IDs dos servidores onde o bot pode ser usado (separados por vírgula e sem espaço)
    - ID:
    - PUBLIC_KEY: Chave pública do bot para interações
    - MYSQLHOST
    - MYSQLUSER
    - MYSQL_ROOT_PASSWORD
    - MYSQLDATABASE

## Estrutura do Banco de Dados
O bot utiliza MySQL2 para armazenar informações sobre convites e cargos vinculados.