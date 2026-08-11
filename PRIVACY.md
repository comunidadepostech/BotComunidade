# Política de Privacidade

Última atualização: 11/08/2026

Este documento descreve como o bot do Discord coleta, usa, armazena e trata dados de servidores e usuários para operar os recursos do sistema de comunidade.

## 1. Quem é o responsável

O bot é administrado pela equipe responsável pelo ambiente de comunidade da organização e é usado para apoiar operações internas de moderação, comunicação, eventos e gestão de canais.

O bot é uma ferramenta **privada e de uso corporativo**: não é disponibilizado publicamente para adição em servidores de terceiros. Apenas administradores autorizados pela organização podem adicioná-lo a novos servidores, conforme descrito nos Termos de Serviço.

## 2. Dados que podem ser coletados

Para operar corretamente, o bot pode armazenar informações relacionadas a mensagens, enquetes, guildas, membros e eventos do Discord, incluindo, entre outros:

- identificador da mensagem;
- conteúdo textual da mensagem;
- nome do servidor/guilda;
- categoria do canal;
- nome do canal;
- nome da thread, quando aplicável;
- nome de usuário ou nome público do autor;
- cargo principal do usuário dentro da guilda;
- identificador do servidor e dados mínimos de configuração da guilda (sigla da turma e clusters associados);
- dados de enquete: pergunta, respostas, quantidade de votos por opção, hash da enquete e nome do criador;
- contagem agregada de membros online por período, sem identificação individual;
- contagem agregada de membros por turma/cargo, sem identificação individual;
- dados de eventos agendados e alertas relacionados;
- flags/recursos habilitados por servidor;
- nome de exibição e avatar de novos membros, usados temporariamente para gerar a imagem de boas-vindas (não ficam armazenados após o envio da mensagem);
- dados de vagas de emprego/estágio divulgadas pela organização (cargo, empresa, modelo de trabalho, habilidades, localização e links de candidatura), quando o recurso de vagas está habilitado — não constituem dados pessoais de membros do servidor.

Esses dados são registrados principalmente para:

- registrar interações em canais públicos, quando esse recurso está habilitado no servidor;
- armazenar enquetes e resultados;
- identificar categorias e canais configurados;
- medir presença online e participação de forma agregada;
- dar suporte a threads automáticas, criação de turmas, alertas, notificações e formulários de feedback;
- divulgar vagas de emprego/estágio nos canais da comunidade;
- manter histórico operacional do bot no servidor.

## 3. O que o bot não faz

- não vende dados pessoais ou de uso do servidor;
- não compartilha dados com fornecedores externos independentes para fins comerciais;
- não usa dados de mensagens para treinar modelos de IA ou sistemas automatizados de aprendizagem;
- não publica dados pessoais em canais de comunicação públicos fora do fluxo operacional do bot;
- não permite que usuários sem permissão de Administrador executem comandos que criem, alterem ou removam estrutura do servidor.

## 4. Como os dados são usados

Os dados são usados exclusivamente para:

- registrar interações e enquetes em canais do Discord, quando habilitado;
- apoiar a criação de turmas, threads automáticas e categorização por canal/categoria;
- contabilizar membros online e métricas agregadas de engajamento;
- realizar notificações de eventos, formulários de feedback e processos de comunidade;
- divulgar vagas de emprego/estágio relevantes para a comunidade;
- manter registros internos de configuração do servidor e dos recursos habilitados.

O bot não utiliza os dados para fins de perfilamento, publicidade, marketing ou análise comercial externa.

## 5. Sistemas internos que recebem os dados

Além do banco de dados interno do bot (MySQL), parte dos dados descritos no item 2 (como mensagens registradas e dados de enquetes, quando os recursos correspondentes estão habilitados) é também encaminhada, por meio de webhook autenticado, a uma plataforma de automação interna (N8N) operada pela mesma equipe responsável pelo bot. Essa automação registra esses dados em uma base própria (incluindo uma base no Notion mantida pela organização), para fins de acompanhamento, organização interna e geração de relatórios da comunidade.

Esses sistemas são de uso interno da equipe responsável pela comunidade e não representam compartilhamento com fornecedores externos independentes ou terceiros alheios à operação do bot.

## 6. Armazenamento e segurança

Os dados são armazenados no banco de dados interno do projeto e nos sistemas internos descritos no item 5, sendo acessados apenas por integrantes e sistemas autorizados para a operação do bot e gestão da comunidade. A organização adota medidas razoáveis de segurança técnica e administrativa para reduzir risco de acesso não autorizado, perda ou uso indevido.

No entanto, nenhum sistema digital é totalmente imune a falhas ou acessos indevidos, e o uso do Discord e de plataformas conectadas também depende das medidas de segurança dessas próprias plataformas.

## 7. Retenção dos dados

A retenção dos dados varia conforme o recurso do bot, o sistema em que o dado está registrado (banco de dados do bot ou sistemas internos descritos no item 5) e a configuração do servidor. Em geral, os dados são mantidos pelo tempo necessário ao funcionamento do sistema e à manutenção de registros internos de operação.

Quando o bot deixa de ser utilizado em um servidor, a coleta de novas informações cessa, mas dados já armazenados podem permanecer conforme a política operacional do projeto e as necessidades técnicas do ambiente.

## 8. Direitos e solicitações

O usuário pode solicitar esclarecimentos sobre a coleta de dados, a finalidade do processamento e a possibilidade de correção ou remoção de registros — inclusive os mantidos nos sistemas internos descritos no item 5 — diretamente com o responsável pelo bot, por meio do contato informado no final desta política.

Em casos em que a exigência legal ou operacional permita, a remoção pode depender de justificativa técnica, de existência de dados obrigatórios para operação do sistema ou do período de retenção aplicado.

## 9. Alterações nesta política

Esta política pode ser atualizada periodicamente para refletir mudanças no uso do bot, nos recursos oferecidos, em requisitos legais ou na infraestrutura operacional. A data de atualização no topo do documento indica a última revisão.

## 10. Contato

Caso tenha dúvidas, solicitações ou queira saber mais sobre o tratamento de dados, entre em contato:

- E-mail: comunidadepostech@fiap.com.br

> [!WARNING]
> Esta política foi escrita com base no funcionamento real do bot e pode ser ajustada por necessidades legais, operacionais ou de compliance, sem aviso prévio em casos de atualização obrigatória.
