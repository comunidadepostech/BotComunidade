# Bot Comunidade Pos Tech

Este é um bot Discord desenvolvido para gerir comunidades com funcionalidades úteis e comandos administrativos que visam otimizar e contribuir com determinadas tarefas da equipe.

## Comandos Disponíveis

### `/invite`
Cria um convite personalizado para o servidor que pode ser vinculado a um cargo específico.

Funciona para qualquer servidor.

**Permissão necessária**: Administrador

**Parâmetros**:
- `channel` (obrigatório): Canal onde o convite será criado
- `role` (obrigatório): Cargo que será atribuído automaticamente aos novos membros que entrarem usando este convite
- `duration` (opcional): Duração do convite em dias (0 para permanente)
- `uses` (opcional): Número máximo de usos do convite (0 para ilimitado)

**Exemplo de uso**: /invite ``channel: #geral`` ``role: @Membro`` ``duration: 7`` ``uses: 10``


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

### `/create`
Pode criar tanto apenas uma nova turma (cargo, permissões e canais) quanto configurar um novo servidor do zero para um novo curso.

Funciona apenas para servidores vazios ou servidores comuns, não pode ser usado para servidores com fontes diferentes (Ex: servidor de egressos).

**Atenção! Para atualizar as funcionalidades de canais, permissões, threads automáticas e quaisquer configurações relacionadas ao formato de criação, deve ser feito uma alteração hard-coded (deve ser implementado uma atualização para isso no futuro), portanto se for necessario qualquer alteração deve-se primeiro contatar o dev responsavel pela manutenção do código.**

**Permissão necessária**: Administrador

**Parâmetros**:
- `type` (obrigatório): o tipo de criação (Curso ou Turma)
- `name` (obrigatório): o nome (sigla) da nova turma (Ex: 1TESTE)
- `faq-channel` (obrigatório apenas para turmas): Menção do canal de faq que a nova turma deve seguir (Ex: `#faq-2025`)

**Exemplos de uso**: 
- /create `type: Turma` `name: 1TESTE` `faq-channel: #faq-2025`
- /create `type: Curso` `name: 1TESTE`

## Funcionalidades Automáticas

### Sistema de Boas-Vindas
O bot automaticamente:
- Envia uma mensagem de boas-vindas no canal `#✨│boas-vindas` quando um novo membro entra
- Atribui automaticamente o cargo vinculado ao convite usado pelo novo membro


### Gerenciamento de enquetes
- Gerencia votos de enquetes criadas, permitindo que os usuários votem e visualizem resultados em tempo real.
- Gerencia multiplos votos ao mesmo tempo, usando um sistema de fila para garantir que os votos sejam contabilizados corretamente.

### Gerenciamento de invites
- Confere se invites antigos ainda existem dentro do servidor e atualiza o banco de dados para economizar espaço

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
    - ID: ID do bot
    - PUBLIC_KEY: Chave pública do bot para interações
    - MYSQLHOST: Endereço do servidor MySQL
    - MYSQLUSER: Usuário do MySQL
    - MYSQL_ROOT_PASSWORD: Senha do usuário MySQL
    - MYSQLDATABASE: Nome do banco de dados MySQL
4. Instale as dependências com `npm install`
5. Inicie o bot com `npm start` ou `node .`

## Estrutura do Banco de Dados
O bot utiliza MySQL2 para armazenar informações.

## Progresso de desenvolvimento e atualizações
Para saber em detalhes o andamento do desenvolvimento acompanhe a aba de projetos e veja os commits da branch `experimental`.

## Requisição para pull request na branch `stable`
- Deve-se sempre testar o código por completo antes de fazer a requisição
- Nunca dê um commit na branch `stable` se não for algo extremamente urgente ou um erro despercebido
- Sempre utilize primeiro a branch `experimental` para fazer testes e implementar novas funcionalidades e atualizações e apenas após completas e testadas que se deve fazer o Pull Request