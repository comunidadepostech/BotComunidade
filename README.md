# Bot Comunidade Pos Tech

Este é um bot Discord desenvolvido para gerir comunidades com funcionalidades úteis e comandos administrativos que visam otimizar e contribuir com determinadas tarefas da equipe.

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

## Estrutura principal do projeto

```txt
BotComunidade/
├── assets/ <-- Imagens usadas no projeto
├── config/ <-- Arquivos de configuração
├── constants <-- Pasta onde é armazenado constantes usadas no projeto
├── controller/
│   ├── commands <-- Pasta onde contém os controllers de todos os comandos junto a sua configuração
├── dtos <-- Pasta que contém os DTOs usados no projeto
├── infrastructure/ <-- Detalhes de infraestrutura (Ex: scheduler, logger e etc.)
├── repositories/
│   ├── database/
├── routes/
│   ├── v1/ <-- Rotas v1 (legado)
│   ├── v2/ <-- Rotas v2
├── services/
│   ├── discord/ <-- Subserviços do Discord
├── tests/ <-- Testes
├── types/ <-- Tipos e interfaces
```

## Desenvolvimento

Para começar a contribuir nesse projeto primeiro é recomendado configurar o ambiente de desenvolvimento. Abaixo está os passos de como configurar o ambiente para a melhor experiência durante seu desenvolvimento:

1. Use `git clone https://github.com/comunidadepostech/BotComunidade.git` para clonar o projeto.
2. É fortemente recomendado o uso do [VS Code](https://code.visualstudio.com/download) para esse projeto, mas outras opções também são compativeis porém com limitações (Ex: Webstorm).
3. Instale o Bun clicando [aqui](https://bun.com/docs/installation).
4. Se estiver usando VS Code, instale as extenções recomendadas no arquivo **.vscode/extensions.json** (do contrário pule essa etapa), após a instalação use o comando `bun eslint . --cache` para criar o arquivo de cache do Eslint.
5. Configure o arquivo **.env** usndo o arquivo **.env.example** como guia.
6. Certifique-se de ter um container (ou similar) de um banco **MySQL** rodando na sua maquina para poder simular o banco em produção (sem isso o projeto não vai iniciar).
7. Instale as dependências usando `bun install`
8. Depois de tudo configurado você está pronto para iniciar o projeto usando `bun run start`

*Dica: Ao modificar o código você pode testar e debugar usando `bun run test` e `bun run debug` respectivamente, lembre-se de que os testes serão feitos antes de qualquer commit então certifique-se de testar antes para não ser barrado. Além disso, use a branch dev para desenvolver e testar a aplicação antes de fazer um Pull Request para Main.

## Usando Docker

Usamos Docker para deploy por sua praticidade e facilidade de uso, para montar a imagem basta usar `docker compose up --build -d` assim a imagem será compilada e o container inicirá automaticamente.

*Dica: Se estiver usando um MySQL em outro container ele não vai conseguir enxergar a conexão local.

## Como montar um Pull Request

Os Pull Requests para branch Main sempre devem conter no título a versão na qual está sendo enviada e a descrição do que aquela versão difere da original, isso serve como boa prática.

## Versionamento

Usamos [SemVer](https://semver.org/lang/pt-BR/) para versionar o projeto, abaixo mostro um exemplo de como versionar sua versão:
```
0.0.0
│ │ ├── Bugfix e pequenas correções
│ ├──── Novas features
├────── Grandes atualizações
```