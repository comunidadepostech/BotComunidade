// Importa as dependencias
require('dotenv').config();
const {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    PollLayoutType,
    PermissionsBitField, TextChannel, ForumChannel
} = require("discord.js");
const mysql = require('mysql2');



// Define os principais acessos que o Bot precisa para poder funcionar corretamente
const client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.GuildMessageReactions
    ]});



// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQLDATABASE,
    waitForConnections: true,
    timeout: 10000,
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no MySQL:', err);
        process.exit(1); // Encerra o processo se não conseguir conectar ao banco de dados para tentar novamente
    }
});

// Cria a tabela de convites, caso não exista
function initializeTables() {
    try {
        // Cria a tabela de convites
        db.query(`
            CREATE TABLE IF NOT EXISTS invites (
                invite VARCHAR(16) PRIMARY KEY NOT NULL,
                role VARCHAR(32) NOT NULL,
                server_id VARCHAR(22) NOT NULL
            )
        `);
        console.log('Tabela de convites verificada com sucesso');

        // Cria a tabela de enquetes
        db.query(`
            CREATE TABLE IF NOT EXISTS polls (
                poll_id VARCHAR(22) PRIMARY KEY NOT NULL,
                poll_json JSON NOT NULL,
                ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabela de enquetes verificada com sucesso');
    } catch (err) {
        console.error('Erro ao inicializar tabelas:', err);
        process.exit(1); // Encerra o processo se não conseguir criar as tabelas
    }
}

initializeTables();



// Cria um Map para gerenciar as filas de poll's e locks de processamento
const pollQueues = new Map();
const processingLocks = new Map();

async function processPollQueue(poll_id) {
    processingLocks.set(poll_id, true); // Marca a enquete como em processamento
    let poll_data = pollQueues.get(poll_id)[0]; // Pega o primeiro item da fila
    try {
        while (pollQueues.get(poll_id)?.length > 0) {
            pollQueues.get(poll_id).shift(); // Remove o primeiro da fila
            const d1 = new Date(poll_data.poll.expiry.slice(0, 23)); // Converte as datas do timestamp e expiry para Date
            const d2 = new Date(poll_data.timestamp.slice(0, 23));
            let poll_json = { // Cria o JSON que será inserido no banco de dados
                question: poll_data.poll.question.text,
                answers: poll_data.poll.answers.map(answer => [
                    answer.poll_media.text,
                    poll_data.poll.results.answer_counts.map(count => count.count)[answer.answer_id - 1]
                ]),
                duration: `${((d1-d2)/1000/60/60).toFixed(0)}:${((d1 - d2)/1000/60).toFixed(0)}:${((d1 - d2)/1000).toFixed(0)}` // Converte de milissegundos para horas
            };
            console.log(d1 - d2, );
            db.promise().query('INSERT INTO polls (poll_id, poll_json) VALUES (?, ?)', [poll_data.id, JSON.stringify(poll_json)]);
        }
    } catch (error) {
        console.error(`${Date()} ERRO - Falha ao processar fila de poll's:`, error);

        // Em caso de erro, limpa a fila para evitar loop infinito
        pollQueues.set(poll_id, []);
    } finally {
        // Libera o processo
        processingLocks.set(poll_id, false);

        // Se novos itens chegaram durante o processamento, processa novamente
        if (pollQueues.get(poll_id)?.length > 0) {
            await processPollQueue(poll_id);
        }
    }

}



// Fecha o banco na saída do processo
process.on('SIGINT', () => {
    db.end(err => {
        if (err) {
            console.error('Erro ao fechar a conexão com o MySQL:', err);
        } else {
            console.log('Conexão com o MySQL fechada');
        }
        process.exit(0);
    })
})



// Define os canais que serão criados para cada turma ou curso
// Cada canal é um objeto com o nome, permissões e tipo:
// GUILD_TEXT (0): A standard text channel within a server.
// GUILD_VOICE (2): A voice channel within a server.
// GUILD_CATEGORY (4): A category used to organize channels.
// GUILD_NEWS (5): A channel that broadcasts messages to other servers.
// GUILD_STAGE_VOICE (13): A stage channel, often used for events and presentations.
// GUILD_FORUM (15): A channel for organizing discussions.
//
// Lembre-se o cargo já tem permiossões definidas no comando create, então não é necessário definir novamente aqui a não ser que queira adicionar mais permissões
classChannels = [
    {
        name: "🙋‍♂️│apresente-se",
        permissions: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
        permissions_deny: [
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 0
    },
    {
        name: "🚨│avisos",
        permissions: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
        permissions_deny: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 0
    },
    {
        name: "💬│bate-papo",
        permissions: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
        permissions_deny: [
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 0
    },
    {
        name: "🧑‍💻│grupos-tech-challenge",
        permissions: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
        permissions_deny: [
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 0
    },
    {
        name: "🎥│gravações",
        permissions: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
        permissions_deny: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 0
    },
    {
        name: "❓│dúvidas",
        permissions: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
        permissions_deny: [
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 15
    },
    {
        name: "🎙️│Dinâmica ao vivo",
        permissions: [
            PermissionsBitField.Flags.ViewChannel
        ],
        permissions_deny: [
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 13
    },
    {
        name: "📒│Sala de estudo [turma]",
        permissions: [
            PermissionsBitField.Flags.ViewChannel
        ],
        permissions_deny: [
            PermissionsBitField.Flags.CreateInstantInvite
        ],
        type: 2
    }
]

classActivations = [
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
        content: "Olá, turma! \n" +
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
            "🎨 JetBrains\n" +
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
        content: "Faaala turma! Tudo bem?\n" +
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





// Define o que o bot deve fazer ao ser iniciado, no caso, imprime uma mensagem de online e cria os comandos existentes
client.once(Events.ClientReady, async c => {
    console.log(`${Date()} LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);



    /* Cada comando é seguido pela ordem:
    *  1. Declaração (const) usando await
    *  2. Registro nos servidores contidos em ALLOWED_SERVERS_ID usando a função loadCommand
    *  !!! Lembre sempre de alterar o nome contido na segunda etapa para cada novo comando !!!
    */

    // Comando de invite: cria um invite que pode ser vinculado a um cargo para que
    // ele atribua o cargo vinculado a cada uso.
    console.log(`${Date()} LOG - Iniciando registro de comandos`);

    async function loadCommand(commandName, command) {
        for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
            try {
                await client.application.commands.create(command, id);
                console.log(`${Date()} COMANDOS - ${commandName} cadastrado em: ${id}`);
            } catch (error) {
                console.log(`${Date()} ERRO - ${commandName} não cadastrado em: ${id}\n${error}`);
            }
        }
    }

    // Comando de invite, cria um convite que pode ser vinculado a um cargo e a um canal específico.
    const invite = await new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Cria um convite para o servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Canal para criar o convite')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Cargo ao qual o convite deve ser vinculado')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duração do convite em dias (0 para permanente)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(365)
        )
        .addIntegerOption(option =>
            option.setName('uses')
                .setDescription('Número máximo de usos (0 para ilimitado)')
                .setRequired(false)
        );
    await loadCommand('invite', invite);

    // Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
    const ping = await new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Responde com Pong!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    await loadCommand('ping', ping);

    // Echo serve para replicar uma mensagem para um ou mais canais definidos pelo usuário
    const echo = await new SlashCommandBuilder()
        .setName("echo")
        .setDescription("Replica uma mensagem para determinado canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Canal no qual a mensagem deve ser enviada")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Conteúdo da mensagem")
                .setRequired(true)
                .setMinLength(1)
        )
    await loadCommand('echo', echo);

    // Display serve para exibir os convites ativos do servidor
    const display = await new SlashCommandBuilder()
        .setName("display")
        .setDescription("Exibe os convites ativos do servidor")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    await loadCommand('display', display);

    // Poll serve para criar uma enquete
    const poll = await new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Cria uma enquete interativa')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Pergunta da enquete')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duração da enquete em horas')
                .setRequired(true)
                .addChoices(
                    { name: '1 hora', value: 1 },
                    { name: '2 horas', value: 2 },
                    { name: '6 horas', value: 6 },
                    { name: '12 horas', value: 12 },
                    { name: '1 dia', value: 24 },
                    { name: '3 dias', value: 72 },
                    { name: '5 dias', value: 120 },
                    { name: '7 dias', value: 168 }
                )
        )
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('Primeira opção')
                .setRequired(true)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Segunda opção')
                .setRequired(true)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Terceira opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Quarta opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Quinta opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option6')
                .setDescription('Sexta opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option7')
                .setDescription('Setima opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option8')
                .setDescription('Oitava opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option9')
                .setDescription('Nona opção')
                .setRequired(false)
                .setMaxLength(55))
        .addStringOption(option =>
            option.setName('option10')
                .setDescription('Décima opção')
                .setRequired(false)
                .setMaxLength(55))
        .addIntegerOption(option =>
            option.setName('allow-multiselect')
                .setDescription('Permite múltipla seleção de opções (padrão: 0 para false)')
                .setRequired(false)
                .addChoices(
                    { name: 'Sim', value: 1 },
                    { name: 'Não', value: 0 }
                )
        );
    await loadCommand('poll', poll);

    const create = await new SlashCommandBuilder()
        .setName('create')
        .setDescription('Cria uma nova turma ou curso')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Define o que você quer criar')
                .setRequired(true)
                .addChoices(
                    { name: 'Curso', value: 'curso' },
                    { name: 'Turma', value: 'turma' }
                )
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nome da turma')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('faq-channel')
                .setDescription('Canal de faq da nova turma (obrigatório para novas turmas)')
                .setRequired(false)
        );

    await loadCommand('create', create);
});



// Interações com os comandos
client.on(Events.InteractionCreate, async interaction => {
    switch (interaction.commandName) {
        case "ping":
            await interaction.reply({content: "pong!", ephemeral: true});
            console.log(`LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
            break;

        case "invite":
            try {
                const channel = interaction.options.getChannel('channel');
                const duration = interaction.options.getInteger('duration') || 0;
                const maxUses = interaction.options.getInteger('uses') || 0;
                const role = interaction.options.getRole('role').name;

                // Cria o convite
                const invite = await channel.createInvite({
                    maxAge: duration * 86400, // Converte dias para segundos
                    maxUses: maxUses,
                    unique: true
                });

                db.query(`INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`, [invite.code, role, interaction.guild.id]);

                // Responde com o link do convite
                await interaction.reply({
                    content: `✅ Convite criado com sucesso!\n📨 Link: ${invite.url}\n📍 Canal: ${channel}\n⏱️ Duração: ${duration === 0 ? 'Permanente' : `${duration} dias`}\n🔢 Usos máximos: ${maxUses === 0 ? 'Ilimitado' : maxUses}\n👥 Cargo vinculado: ${role}`,
                    ephemeral: true // Faz a resposta ser visível apenas para quem executou o comando
                }).then(_ => console.log(`${Date()} LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`));
            } catch (error) {
                console.error(`${Date()} Erro ao criar convite:`, error);
                await interaction.reply({
                    content: `❌ Ocorreu um erro ao criar o convite. Verifique se tenho permissões suficientes.\n` + "```" + error + "```",
                    ephemeral: true
                });
            }
            break;

        case "echo":
            let message = interaction.options.getString("message")
            const echoChannel = interaction.options.getChannel("channel", true);
            if (!echoChannel.isTextBased()) {
                await interaction.reply({
                    content: "❌ O canal especificado não é um canal de texto.",
                    ephemeral: true
                });
                return;
            } else {
                await echoChannel.send(message).then(_ => {
                    interaction.reply({
                        content: `✅ Mensagem enviada para ${echoChannel} com sucesso!`,
                        ephemeral: true
                    });
                    console.log(`${Date()} LOG - echo ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
                }).catch(error => {
                    console.error(`${Date()} ERRO - Falha ao enviar mensagem:`, error);
                    interaction.reply({
                        content: "❌ Ocorreu um erro ao enviar a mensagem.\n" + "```" + error + "```",
                        ephemeral: true
                    });
                });
            }
            break;

        case "display":
            try {
                // Busca os convites ativos do servidor
                db.query(`SELECT * FROM invites WHERE server_id = ?`, [interaction.guild.id], async (err, rows) => {
                    if (err) {
                        console.error(`${Date()} ERRO - Erro na consulta SQL:`, err);
                        await interaction.reply({
                            content: "❌ Ocorreu um erro ao buscar os convites.",
                            ephemeral: true
                        });
                        return;
                    }

                    // Verifica se há convites no banco de dados
                    if (rows.length === 0) {
                        await interaction.reply({
                            content: "Nenhum convite ativo encontrado.",
                            ephemeral: true
                        });
                        return;
                    }

                    // Verifica os convites existentes
                    rows.forEach(invite => {
                        interaction.guild.invites.fetch().then(invites => {
                            if (!invites.has(invite.invite)) {
                                db.query(`DELETE FROM invites WHERE invite = ?`, [invite.invite], (err) => {
                                    if (err) {
                                        console.error(`${Date()} ERRO - Erro ao remover convite inválido:`, err);
                                    } else {
                                        console.log(`${Date()} LOG - Convite inválido removido: ${invite.invite}`);
                                    }
                                });
                            }
                        }).catch(err => {
                            console.error(`${Date()} ERRO - Falha ao buscar convites do servidor:`, err);
                        });
                    })

                    // Formata a resposta com os convites
                    let response = "Convites ativos:\n";
                    rows.forEach(invite => {
                        response += `- **${invite.role}:** https://discord.gg/${invite.invite}\n`;
                    });
                    await interaction.reply({
                        content: response,
                        ephemeral: true
                    });
                });
                break;
            } catch (error) {
                console.error(`${Date()} ERRO - Falha ao buscar convites:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao buscar os convites.\n"  + "```" + error + "```",
                    ephemeral: true
                });
            }
            break;

        case "poll":
            try {
                const question = interaction.options.getString('question');
                const duration = interaction.options.getInteger('duration');
                const multiselect = interaction.options.getInteger('allow-multiselect') || 0;
                const options = [
                    interaction.options.getString('option1'),
                    interaction.options.getString('option2'),
                    interaction.options.getString('option3'),
                    interaction.options.getString('option4'),
                    interaction.options.getString('option5'),
                    interaction.options.getString('option6'),
                    interaction.options.getString('option7'),
                    interaction.options.getString('option8'),
                    interaction.options.getString('option9'),
                    interaction.options.getString('option10')
                ].filter(option => option); // Remove opções vazias

                let filteredOptions = options.filter(option => option !== null && option !== undefined);
                const pollAnswers = filteredOptions.map(option => ({text: option}));

                await interaction.channel.send({
                    poll: {
                        question: {text: question, unicode_emoji: "U+1FAE8"},
                        answers: pollAnswers,
                        allowMultiselect: multiselect,
                        duration: duration,
                        layoutType: PollLayoutType.Default
                    }
                });

                await interaction.reply({content: "✅ Enquete criada com sucesso!", ephemeral: true});

            } catch (error) {
                console.error(`${Date()} ERRO - Falha ao criar enquete:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao criar a enquete.\n" + error,
                    ephemeral: true
                });
            }
            break;

        case "create":
            await interaction.deferReply({ephemeral: true}); // Responde de forma atrasada para evitar timeout
            const createType = interaction.options.getString('type');
            const className = interaction.options.getString('name');
            if (createType == 'turma') {
                try {
                    const faqChannel = interaction.options.getChannel('faq-channel').name

                    const classRole = await interaction.guild.roles.create({
                        name: `Estudantes ${className}`,
                        color: 3447003,
                        mentionable: true, // Permite que o cargo seja mencionado
                        hoist: true, // Exibe o cargo na lista de membros
                        permissions: [
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
                    });

                    await client.guilds.cache.get(interaction.guild.id).channels.cache.forEach(channel => {
                        if (["✨│boas-vindas", "📃│regras", faqChannel, "📅│acontece-aqui", "🚀│talent-lab", "💻│casa-do-código"].includes(channel.name)) { // Ignora canais não especificados
                            channel.permissionOverwrites.edit(classRole, {
                                SendMessages: true,
                                ViewChannel: true,
                                ReadMessageHistory: true,
                                AddReactions: true
                            });
                        }
                    });

                    //const roles = (await interaction.guild.roles.fetch()).map(role => [].includes(role.name)? role.id : null).filter(role => role !== null);
                    const roles = await interaction.guild.roles.fetch();
                    //console.log(roles)
                    //interaction.guild.roles.everyone.id

                    const classCategory = await interaction.guild.channels.create({
                        name: className,
                        type: 4, // Categoria
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone,
                                deny: ["ViewChannel"]
                            }]/*
                            {
                                id: roles.find(role => role.name === "Equipe Pós-Tech")?.id,
                                allow: [PermissionsBitField.Flags.ViewChannel]
                            },
                            {
                                id: roles.find(role => role.name === "Gestor Acadêmico")?.id,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.CreatePublicThreads,
                                    PermissionsBitField.Flags.EmbedLinks,
                                    PermissionsBitField.Flags.AttachFiles,
                                    PermissionsBitField.Flags.AddReactions,
                                    PermissionsBitField.Flags.MentionEveryone,
                                    PermissionsBitField.Flags.ReadMessageHistory,
                                    PermissionsBitField.Flags.SendPolls
                                ]
                            },
                            {
                                id: roles.find(role => role.name === "Coordenação")?.id,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.CreatePublicThreads,
                                    PermissionsBitField.Flags.EmbedLinks,
                                    PermissionsBitField.Flags.AttachFiles,
                                    PermissionsBitField.Flags.AddReactions,
                                    PermissionsBitField.Flags.MentionEveryone,
                                    PermissionsBitField.Flags.ReadMessageHistory,
                                    PermissionsBitField.Flags.SendPolls
                                ]
                            },
                            {
                                id: roles.find(role => role.name === "Professores")?.id,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.CreatePublicThreads,
                                    PermissionsBitField.Flags.EmbedLinks,
                                    PermissionsBitField.Flags.AttachFiles,
                                    PermissionsBitField.Flags.AddReactions,
                                    PermissionsBitField.Flags.MentionEveryone,
                                    PermissionsBitField.Flags.ReadMessageHistory,
                                    PermissionsBitField.Flags.SendPolls
                                ]
                            }
                        ]*/
                    });

                    for (const channel of classChannels) {
                        await interaction.guild.channels.create({
                            name: channel.name,
                            type: channel.type,
                            parent: classCategory.id // Define a categoria da turma
                            //permissionOverwrites: []
                        }).then(async (target) => {
                            if (channel.name === "❓│dúvidas") {
                                await target.setAvailableTags(
                                    [
                                        {
                                            name: "Geral",
                                            moderated: false
                                        },
                                        {
                                            name: "Tech Challenge",
                                            moderated: false
                                        },
                                        {
                                            name: "Fase 1",
                                            moderated: false
                                        },
                                        {
                                            name: "Fase 2",
                                            moderated: false
                                        },
                                        {
                                            name:"Fase 3",
                                            moderated: false
                                        },
                                        {
                                            name: "Fase 4",
                                            moderated: false
                                        },
                                        {
                                            name: "Fase 5",
                                            moderated: false
                                        },
                                        {
                                            name: "Alura",
                                            moderated: false
                                        },
                                        {
                                            name: "Beneficios",
                                            moderated: false
                                        },
                                        {
                                            name: "Financeiro",
                                            moderated: false
                                        },
                                        {
                                            name: "Atividade presencial",
                                            moderated: false
                                        },
                                        {
                                            name: "Lives",
                                            moderated: false
                                        },
                                        {
                                            name: "Notas",
                                            moderated: false
                                        },
                                        {
                                            name: "Eventos",
                                            moderated: false
                                        }
                                    ]
                                );
                                for (activate of classActivations) {
                                    await target.threads.create(
                                        {
                                            name: activate.title,
                                            message: {content: activate.content}
                                        }
                                    )
                                }
                            }
                        })
                    }

                } catch (error) {
                    console.error(error);
                    await interaction.editReply({
                        content: `❌ Erro ao criar ${className}\n` + "```" + error + "```",
                        ephemeral: true
                    });
                    return;
                }
            } else if (createType == 'curso') {
                const classCategory = await interaction.guild.channels.create({
                    name: className,
                    type: 4, // Categoria
                    permissionOverwrites: [
                        {
                            id: classRole, // Permissões para o usuário que criou a turma
                            allow: [
                                'ManageMessages',
                                'ManageChannels'
                            ],
                        }
                    ]
                });
            } else {
                await interaction.reply({
                    content: "❌ Tipo de criação inválido.",
                    ephemeral: true
                });
                return;
            }




            break;

        default:
            break;
    }
});



// Evento que é disparado quando uma enquete termina
client.on('raw', async (packet) => {
    if (!packet.t || !['MESSAGE_UPDATE'].includes(packet.t)) return;
    try {
        if (packet.d.poll.results.is_finalized) {
            const poll_id = packet.d.id;

            // Adiciona a poll à fila de processamento
            if (!pollQueues.has(poll_id)) {
                pollQueues.set(poll_id, []);
            }
            pollQueues.get(poll_id).push(packet.d);

            // Processa a fila se não estiver sendo processada
            if (!processingLocks.get(poll_id)) {
                await processPollQueue(poll_id);
            }
        }
    } catch (error) {}
});



// Evento que é disparado quando um novo membro entra no servidor
client.on(Events.GuildMemberAdd, async member => {

    // Tenta buscar o invite usado pelo novo membro
    try {
        let used_invite;
        const cachedInvites = await member.guild.invites.fetch();

        // Tenta resolver o invite diretamente
        const resolvedInvite = await member.guild.invites.resolve(member.user.client);
        if (resolvedInvite) {
            used_invite = resolvedInvite.code;
        } else {
            // Se não conseguir resolver, pega o primeiro invite ativo
            const activeInvite = cachedInvites.find(invite => invite.uses > 0);
            used_invite = activeInvite ? activeInvite.code : null;
        }

        if (!used_invite) {
            console.log(`${Date()} ERRO - Não foi possível determinar o convite usado`);
            return;
        }

        // Registra o log de entrada do membro
        console.log(`${Date()} LOG - ${member.user.username} entrou no servidor ${member.guild.name} com o código: ${used_invite}`);

        // Busca o canal de boas-vindas e envia a mensagem
        try {
        const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === "✨│boas-vindas");
        if (welcomeChannel) {
            await welcomeChannel.send(`Olá ${member}, seja bem-vindo(a) a comunidade!`);
        }} catch (error) {
            console.error(`${Date()} ERRO - Falha ao enviar mensagem de boas-vindas:`, error);
        }

        // Busca o cargo vinculado ao invite no banco
        db.query("SELECT role FROM invites WHERE invite = ?", [used_invite], async (err, rows) => {
                if (err) {
                    console.error(`${Date()} ERRO - Erro na consulta SQL:`, err);
                    return;
                }

                // Verifica se há resultados
                if (!rows || rows.length === 0) {
                    console.log(`${Date()} ERRO - Nenhum cargo vinculado ao convite usado`);
                    return;
                }

                const welcome_role = await member.guild.roles.cache.find(role => role.name === rows[0].role);
                if (!welcome_role) {
                    console.log(`ERRO - Cargo ${rows[0].role} não encontrado no servidor`);
                    return;
                }

                await member.roles.add(welcome_role);
                console.log(`${Date()} LOG - ${member.user.username} adicionado ao cargo ${welcome_role.name}`);
            }
        );
    } catch (error) {
        console.error(`${Date()} ERRO ao processar novo membro:`, error);
    }
});



try {
    client.login(process.env.TOKEN).then(_ => console.log(`${Date()}`));

} catch (error) {
    console.log(`${Date()} ERRO - Bot não iniciado\n${error}`);
}