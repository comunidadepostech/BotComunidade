
// Define os canais que serão criados para cada turma ou curso
// Cada canal é um objeto com o nome, permissões e tipo:
//
// GUILD_TEXT (0): A standard text channel within a server.
// GUILD_VOICE (2): A voice channel within a server.
// GUILD_CATEGORY (4): A category used to organize channels.
// GUILD_NEWS (5): A channel that broadcasts messages to other servers.
// GUILD_STAGE_VOICE (13): A stage channel, often used for events and presentations.
// GUILD_FORUM (15): A channel for organizing discussions.
//
// Lembre-se o cargo já tem permiossões definidas no comando create, então não é necessário definir novamente aqui a não ser que queira adicionar mais permissões
export const classChannels = [
    {name: "🙋‍♂️│apresente-se", type: 0, position: 0},
    {name: "🚨│avisos", type: 0, position: 1}, // Definido como especial (hardcoded na posição 1)
    {name: "💬│bate-papo", type: 0, position: 2},
    {name: "🧑‍💻│grupos-tech-challenge", type: 0, position: 3},
    {name: "🎥│gravações", type: 0, position: 4}, // Definido como especial (hardcoded na posição 4)
    {name: "❓│dúvidas", type: 15, position: 5},
    {name: "🎙️│Dinâmica ao vivo ", type: 13, position: 6}, // Deixar o espaço no final para colocar a sigla da turma quando o comando /create for utilizado. Definido como especial (hardcoded na posição 6)
    {name: "📒│Sala de estudo ", type: 2, position: 7} // Deixar o espaço no final para colocar a sigla da turma quando o comando /create for utilizado. Definido como especial (hardcoded na posição 7)
]


// Certifique-se de primeiro testar a mensagem no discord e depois clique no icone de copiar mensagem (não dê Ctrl+C) e cole dentro de uma String vazia
// Para marcar o cargo basta adicionar {mention} em qualquer parte da String
export const classActivations = [
    {
        title: "Integração Calendário",
        content: "# 📢 Integração Calendário + Discord\n" +
            "\n" +
            "Você sabia que é possível **integrar os eventos do Discord ao seu calendário do Outlook**?\n" +
            "\n" +
            "Preparamos um **guia simples e objetivo** para te ajudar a manter seus compromissos do servidor organizados direto no seu e-mail.\n" +
            "\n" +
            "🔗 https://youtu.be/QqyxxZwzsR8 e sincronize seus eventos com praticidade."
    },
    {
        title: "Composição da Nota",
        content: "Olá, turma! {mention}\n" +
            "\n" +
            "Viemos informar sobre a composição das notas para os cursos da Postech. A avaliação é composta pelos seguintes elementos:\n" +
            "\n" +
            "CAPÍTULO III – DOS CRITÉRIOS DE AVALIAÇÃO E DE APROVAÇÃO\n" +
            "\n" +
            "**Artigo 10º** - O desempenho do(a) estudante para avaliação e aprovação dar-se-á por meio de avaliação on-line e avaliação presencial.\n" +
            "\n" +
            "**§ 1º** - A pontuação compor-se-á do seguinte critério:\n" +
            "I. Das atividades on-line em cada fase com valor de 0 a 90 pontos- Tech Challenge – Fases 1 a 4\n" +
            "II. Hackathon – Fase 5 (o formato pode variar dependendo do curso: Datathon, Capture the Flag, Hackathon, etc.) - 0 a 90 pontos\n" +
            "III. Da avaliação presencial individual e obrigatória a ser agendada em qualquer um dos polos FIAP com valor de 0 a 10 pontos.\n" +
            "\n" +
            "**§ 2º** - O cálculo da Nota Final (NF) levará em consideração o somatório dos dois processos avaliativos:\n" +
            "\n" +
            "Atividades on-line (90) + Atividade presencial (10) = 100 pontos.\n" +
            "\n" +
            "Obs: todas as informações sobre as notas serão apresentadas para a turma na Aula Inaugural.\n" +
            "\n" +
            "Equipe Comunidade Postech!"
    },
    {
        title: "Carteirinha de Estudante",
        content: "Fala turma!!\n" +
            "\n" +
            "Gostaria de avisar que vocês tem acesso a carteirinha de estudante através do app \"FIAP\".\n" +
            "\n" +
            "Lá no App você segue os passos indicados e pode gerar a sua carteirinha digital.\n" +
            "\n" +
            "Segue os links para download:\n" +
            "App Store: [‎FIAP ON](https://apps.apple.com/br/app/fiap-on/id1270235539)\n" +
            "Play Store: [fiap on - Android Apps on Google Play](https://play.google.com/store/search?q=fiap+on&c=apps)\n" +
            "\n" +
            "Caso tenham alguma dificuldade, podem entrar em contato com o nosso atendimento pelo email: [atendimento.postech@fiap.com.br](mailto:atendimento.postech@fiap.com.br) ou Whatsapp (11)98170-0028"
    },
    {
        title: "Ferramentas Disponíveis para Acesso",
        content: "Estamos começando com tudo, e vocês têm à disposição várias ferramentas tecnológicas incríveis que vão dar aquele boost nos estudos. 🚀\n" +
            "\n" +
            "🔧 Visual Studio Code\n" +
            "\n" +
            "🐙 GitHub\n" +
            "\n" +
            "🤖 GitHub Copilot\n" +
            "\n" +
            "🔨 Rider\n" +
            "\n" +
            "🐙 GitKraken\n" +
            "\n" +
            "☁️ Azure\n" +
            "\n" +
            "💻 JetBrains\n" +
            "\n" +
            "🎨 Figma\n" +
            "\n" +
            "🛠️ DataGrip\n" +
            "\n" +
            "🔧 MS Visual Studio for Students\n" +
            "\n" +
            "🎓 Benefícios Microsoft: Acesse várias ferramentas e recursos exclusivos para estudantes, como o [Microsoft 365](https://www.microsoft.com/pt-br/education/products/office), o [Azure for Students](https://azure.microsoft.com/pt-br/pricing/purchase-options/azure-account/search) e o [Visual Studio](https://www.linkedin.com/pulse/visual-studio-dev-essentials-free-thiago-adriano/)\n" +
            "\n" +
            "Para acessar esses benefícios, você precisa adicionar o seu email da FIAP.\n" +
            "Qualquer dúvida, estamos por aqui para ajudar. 😉"
    },
    {
        title: "Boas Práticas para a Comunidade",
        content: "Faaala turma {mention}! Tudo bem?\n" +
            "\n" +
            "Como uma boa prática do servidor, solicitamos que todos os estudantes insiram no nome de usuário do Discord, o seu RM.\n" +
            "\n" +
            "Para realizar esta troca, basta clicar na sua foto de perfil e após no ícone de lápis (no canto superior direito do banner que aparecerá).\n" +
            "\n" +
            "Por lá, vai aparecer o campo de \"Nome exibido\" e você poderá adicionar o seu RM. No meu caso ficaria: Eduardo Bortoli - RM123456.\n" +
            "Caso você queira mudar o nome apenas no servidor da turma: Após clicar no lápis, você pode ir na opção \"perfis do servidor\" e alterar apenas o \"apelido do servidor\" Depois de mudar o seu nome/apelido, basta salvar a alteração e já está tudo certo.\n" +
            "\n" +
            "Desta maneira, toda vez que um aluno ou aluna precisar de auxílio, conseguiremos buscar direto na plataforma os seus dados e resolver de maneira muito mais ágil todos os seus chamados. \n" +
            "\n" +
            "Contamos com a ajuda de vocês e seguimos por aqui! Abraços!"
    },
    {
        title: "Como acessar meu certificado da Fase?",
        content: "Se você finalizou e enviou o Tech Challenge, o seu certificado da fase já está disponível na plataforma!\n" +
            "\n" +
            "Nosso time preparou um vídeo para explicar o passo a passo, caso você ainda tenha dúvidas sobre como realizar o download e compartilhar seu certificado de fase nas redes.\n" +
            "\n" +
            "Link: https://youtu.be/k1fVMSg5OmU"
    },
    {
        title: "E-mail Estudantil @fiap",
        content: "Olá, turma!! Temos uma informação importante para vocês sobre a caixa de e-mail @‌fiap:\n" +
            "\n" +
            "- Referente as caixas de e-mail dos estudantes, o acesso é apenas para o benefício do pacote office e solicitação de algumas ferramentas (planos para estudantes);\n" +
            "\n" +
            "- A CAIXA NÃO ESTÁ HABILITADA PARA ENVIAR E-MAILS!\n" +
            "\n" +
            "- O envio de comunicações em geral, é feito apenas através do **e-mail cadastrado pelo aluno ou aluna no ato da matrícula.**\n" +
            "\n" +
            "**O acesso ao pacote office deve ser feito da seguinte forma:**\n" +
            "\n" +
            "**Link:** [Free Office 365 for Students and Educators | Microsoft Education](http://office.com/getoffice365)\n" +
            "**E-MAIL:** rm......@fiap.com.br (No lugar dos pontinhos será o número do seu rm)\n" +
            "**Senha:** DtNasc#...... (No lugar dos pontinhos sua data de nascimento no formato curto o ano, ex: 010698) No caso ficaria: DtNasc#010698 (As letras \"D\" e \"N\" são maiúsculas e fazem parte da senha) Seguindo o exemplo acima, para acessar utilizaríamos:\n" +
            "\n" +
            "**Login:** rm123456@fiap.com.br\n" +
            "**Senha:** DtNasc#010698\n" +
            "No site do Office > Selecionar Instalar Aplicativos Office. Todos os alunos e alunas matriculadas, já possuem esse acesso liberado.\n" +
            "\n" +
            "**Qualquer problema deve ser direcionado ao nosso TI, pelos canais:** Helpdesk@fiap.com.br ou pelo WhatsApp (11) 98170 0028 (selecionar opção 2 para suporte técnico).\n" +
            "\n" +
            "P.S.: Se você não conseguiu acessar a caixa de e-mail por conta de algum erro, ou está com dúvidas, entre em contato com o time de HelpDesk para receber o suporte adequado. Eles terão os acessos necessários para corrigir eventuais falhas.\n"
    }
]

export const classRolePermissions = [
    'ChangeNickname',
    'SendMessagesInThreads',
    'CreatePublicThreads',
    'AttachFiles',
    'EmbedLinks',
    'AddReactions',
    'UseExternalEmojis',
    'ReadMessageHistory',
    'Connect',
    'SendMessages',
    'Speak',
    'UseVAD',
    'Stream',
    'RequestToSpeak',
    'UseExternalStickers'
]

export const somePermissionsChannels = ["✨│boas-vindas", "📃│regras"] // incluir faq-channel no código
export const allPermissionsChannels = ["📅│acontece-aqui", "🚀│talent-lab", "💻│casa-do-código"]