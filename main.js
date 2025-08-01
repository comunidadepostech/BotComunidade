// Importa as dependencias
require('dotenv').config();
const {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    PollLayoutType
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
            const d1 = new Date(poll_data.timestamp.slice(0, 23)); // Converte as datas do timestamp e expiry para Date
            const d2 = new Date(poll_data.poll.expiry.slice(0, 23));
            let poll_json = { // Cria o JSON que será inserido no banco de dados
                question: poll_data.poll.question.text,
                answers: poll_data.poll.answers.map(answer => [answer.poll_media.text, poll_data.poll.answers.map(count => count.count)[answer.answer_id - 1]]),
                duration: d2 - d1 / 1000 / 60 / 60 // Converte de milissegundos para horas
            };
            console.log(poll_json);
            //db.promise().query('INSERT INTO polls (poll_id, poll_json) VALUES (?, ?)', [poll_data.id, JSON.stringify(poll_json)]);
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
        /*.addStringOption(option =>
            option.setName('option1emoji')
                .setDescription('Emoji da primeira opção')
                .setRequired(false)
                .addChoices(
                    { name: '✅', value: '✅' },
                    { name: '❌', value: '❌' },
                    { name: '👍', value: '👍' },
                    { name: '👎', value: '👎' },
                    { name: '🤷‍♂️', value: '🤷‍♂️' }
                )
        )*/
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

    const createclass = await new SlashCommandBuilder()
        .setName('createclass')
        .setDescription('Cria uma nova turma')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nome da turma')
                .setRequired(true));
    //await loadCommand('createclass', createclass);
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
                    content: '❌ Ocorreu um erro ao criar o convite. Verifique se tenho permissões suficientes.',
                    ephemeral: true
                });
            }
            break;

        case "echo":
            let message = interaction.options.getString("message")
            const channel = interaction.options.getChannel("channel", true);
            if (!channel.isTextBased()) {
                await interaction.reply({
                    content: "❌ O canal especificado não é um canal de texto.",
                    ephemeral: true
                });
                return;
            } else {
                await channel.send(message).then(_ => {
                    interaction.reply({
                        content: `✅ Mensagem enviada para ${channel} com sucesso!`,
                        ephemeral: true
                    });
                    console.log(`${Date()} LOG - echo ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
                }).catch(err => {
                    console.error(`${Date()} ERRO - Falha ao enviar mensagem:`, err);
                    interaction.reply({
                        content: "❌ Ocorreu um erro ao enviar a mensagem.",
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
                    content: "❌ Ocorreu um erro ao buscar os convites.",
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

            } catch (error) {
                console.error(`${Date()} ERRO - Falha ao criar enquete:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao criar a enquete.",
                    ephemeral: true
                });
            }
            break;

        case "createclass":
            client.channels.cache.get(interaction.channel.id).send("Criando turma...");
            const className = interaction.options.getString('name');
            const role = await interaction.guild.roles.create({
                name: className,
                color: '3447003',
                mentionable: true,
                permissions: [
                    'ViewChannel',
                    'SendMessages',
                    'Speak',
                    'UseVAD',
                    'Connect',
                    'AttachFiles'
                ]
            });
            const classCategory = await interaction.guild.channels.create({
                name: className,
                type: 4, // Categoria
                permissionOverwrites: [
                    {
                        id: role.id, // Permissões para o usuário que criou a turma
                        allow: ['ManageMessages', 'ManageChannels'],
                    }
                ]
            });
            break;

        default:
            break;
    }
});



// Evento que é disparado quando uma enquete termina
client.on('raw', async (packet) => {
    if (!packet.t || !['MESSAGE_UPDATE'].includes(packet.t)) return;
    console.log(packet);
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
        console.log(`LOG - ${member.user.username} entrou no servidor ${member.guild.name} com o código: ${used_invite}`);

        // Busca o canal de boas-vindas e envia a mensagem
        const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === "✨│boas-vindas");
        if (welcomeChannel) {
            await welcomeChannel.send(`Olá ${member}, seja bem-vindo(a) a comunidade!`);
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