<img src="./assets/postech.png" alt="">

# Bot Comunidade Pos Tech

Este é um bot Discord desenvolvido para gerir comunidades com funcionalidades úteis e comandos administrativos que visam otimizar e contribuir com determinadas tarefas da equipe.

---

## Como instalar e executar (serviço interno)

1. Certifique-se de que o Bot tenha as permissões necessárias no servidor (o cargo deve estar apenas em baixo do cargo admin ou Community Managers)

2. Crie e configure um arquivo .env na raiz do projeto com as variáveis de ambiente contidas no arquivo de exemplo .env.example

3. Crie a imagem usando `docker-compose up --build -d` ou inicie o bot com  `bun install && bun run start`.

---

## Comandos Disponíveis

> **Nota:** Todos os comandos abaixo requerem permissão de **Administrador**.

<details>
<summary><strong><code>/ping</code></strong> — Verifica o status do bot</summary>

**Escopo:** Qualquer servidor

Verifica se o bot está online e respondendo. O bot responderá com "pong!" para confirmar que está funcionando perfeitamente.
</details>


<details>
<summary><strong><code>/echo</code></strong> — Replica uma mensagem em canais</summary>

**Escopo:** Qualquer servidor

Replica uma mensagem para um ou todos os canais de todos os servidores.

**Parâmetros:**
- `channel` *(obrigatório)*: Canal onde a mensagem será enviada.
- `message` *(obrigatório)*: Conteúdo da mensagem (dica: use \n para pular linhas).
- `Attachment1` *(opcional)*: Anexo 1.
- `Attachment2` *(opcional)*: Anexo 2.
- `only-for-this-channel` *(opcional, padrão: não)*: Se sim, o bot enviará a mensagem apenas para o canal especificado.

**Exemplo de uso:**
/echo channel: #anúncios message: Olá a todos! Bem-vindos ao servidor!
</details>


<details>
<summary><strong><code>/poll</code></strong> — Cria uma enquete interativa</summary>

**Escopo:** Qualquer servidor

Cria uma enquete interativa com opções de votação personalizadas (até 10 opções).

**Parâmetros:**
- `question` *(obrigatório)*: A pergunta principal da enquete.
- `option1` e `option2` *(obrigatórios)*: Primeira e segunda opções de voto.
- `option3` a `option10` *(opcionais)*: Opções de voto extras.
- `duration` *(opcional, padrão: 24h)*: Tempo que a enquete ficará ativa (em horas).
- `multiple` *(opcional, padrão: false)*: Se Sim, permite que os usuários votem em várias opções.

**Exemplo de uso:**
/poll question: Qual seu dia preferido para eventos? duration: 1 option1: Sábado option2: Domingo allow-multiselect: Sim
</details>


<details>
<summary><strong><code>/createclass</code></strong> — Cria estrutura para nova turma</summary>

**Escopo:** Apenas servidores comuns *(Não suporta servidores de egressos, etc.)*

Cria cargo, categoria, canais e configura as permissões para uma nova turma com um link de convite.

**Parâmetros:**
- `name` *(obrigatório)*: O nome (sigla) da nova turma (Ex: 1TESTE).
- `faq-channel` *(obrigatório apenas para turmas)*: Menção do canal de FAQ que a nova turma deve seguir (Ex: #faq-2025).

**Exemplo de uso:**
/createclass name: 1TESTE faq-channel: #faq-2025
</details>


<details>
<summary><strong><code>/event</code></strong> — Cria um evento agendado</summary>

**Escopo:** Qualquer servidor

Cria um evento oficial diretamente no servidor do Discord com banner e link associado.

**Parâmetros:**
- `topic` *(obrigatório)*: Tópico do evento.
- `start-date` *(obrigatório)*: Data inicial do evento (YYYY-MM-DD).
- `start-time` *(obrigatório)*: Hora inicial do evento (HH:MM, 24 horas).
- `end-date` *(obrigatório)*: Data final do evento (YYYY-MM-DD).
- `end-time` *(obrigatório)*: Hora final do evento (HH:MM, 24 horas).
- `description` *(obrigatório)*: Descrição do evento (dica: use \n para pular linhas).
- `link` *(obrigatório)*: Link relacionado ao evento (Ex: link do Meet/Zoom).
- `background` *(obrigatório)*: Imagem de fundo/banner para o evento (anexo).

**Exemplo de uso:**
/event topic: Aula Magna start-date: 2025-11-01 start-time: 20:00 end-date: 2025-11-01 end-time: 22:00 description: Aula introdutória link: [https://teste.com](https://teste.com) background: [anexo_da_imagem]
</details>


<details>
<summary><strong><code>/disable</code></strong> — Desabilita uma turma</summary>

**Escopo:** Apenas servidores comuns

Desativa as configurações e acessos referentes a uma turma específica do servidor.

**Parâmetros:**
- `role` *(obrigatório)*: Menção ao cargo da turma.

**Exemplo de uso:**
/disable role: @Estudantes 11SOAT
</details>


<details>
<summary><strong><code>/exec</code></strong> — Executa evento do scheduler</summary>

**Escopo:** 🏢 Apenas servidores comuns

Força a execução de uma tarefa/evento agendado no scheduler do bot.

**Parâmetros:**
- `command` *(obrigatório)*: Comando/tarefa a ser executado.

**Exemplo de uso:**
/exec command: Checagem de eventos do servidor
</details>


<details>
<summary><strong><code>/updateflag</code></strong> — Atualiza uma feature flag</summary>

**Escopo:** Qualquer servidor

Atualiza uma feature flag do bot (Dica: use ; para ativar ou desativar mais de uma flag).

**Parâmetros:**
- `id` *(obrigatório)*: ID da mensagem da enquete no Discord.

**Exemplo de uso:**
/updateflag flag: comando_exec;comando_disable value: true
</details>


<details>
<summary><strong><code>/viewflags</code></strong> — Mostra as feature flags</summary>

**Escopo:** Qualquer servidor

Cria uma visualização em JSON das flags que o bot tem.
</details>


<details>
<summary><strong><code>/refresh</code></strong> — Recarrega os comandos dos servidores</summary>

**Escopo:** Qualquer servidor

Recarrega os comandos dos servidores para caso de erro.
</details>