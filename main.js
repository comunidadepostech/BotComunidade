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
    database: process.env.MYSQLDATABASE
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL!');
});

// Cria a tabela de convites, caso não exista
db.query(`CREATE TABLE IF NOT EXISTS invites (
            invite VARCHAR(16) PRIMARY KEY NOT NULL,
            role VARCHAR(32) NOT NULL,
            server_id VARCHAR(22) NOT NULL)`, (err) => {
    if (err) {
        console.error('Erro ao verificar tabela de invites:', err);
    }
});

// Cria a tabela de enquetes, caso não exista
db.query(`CREATE TABLE IF NOT EXISTS polls (
            poll_id VARCHAR(22) PRIMARY KEY NOT NULL,
            poll_json JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`, (err) => {
    if (err) {
        console.error('Erro ao verificar tabela de enquetes:', err);
    }
});



// Define o que o bot deve fazer ao ser iniciado, no caso, imprime uma mensagem de online e cria os comandos existentes
client.once(Events.ClientReady, async c => {
    console.log(`${Date()} LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);

    /*
    // Carrega as enquetes antigas do banco de dados
    console.log(`${Date()} LOG - Carregando enquetes antigas do banco de dados`);
    db.query('SELECT poll_id FROM polls', async (err, rows) => {
        if (err) {
            console.error('Erro ao carregar cache das enquetes:', err);
            return;
        }

        for (const row of rows) {
            try {
                // Buscar mensagem da enquete em todos os canais
                const guilds = client.guilds.cache.values();
                for (const guild of guilds) {
                    const channels = guild.channels.cache
                        .filter(channel => channel.type === 0) // Apenas canais de texto
                        .values();

                    for (const channel of channels) {
                        try {
                            await channel.messages.fetch(row.poll_id);
                        } catch (e) {
                            // Ignora o erro se a mensagem não for encontrada
                        }
                    }
                }
            } catch (error) {
                console.error(`${Date()} ERRO - Erro ao carregar enquete ${row.poll_id}:`, error);
            }
        }
        console.log(`${Date()}Carregamento de enquetes antigas concluído`);
    });
    */


    /* Cada comando é seguido pela ordem:
    *  1. Declaração (const) usando await
    *  2. Registro nos servidores contidos em ALLOWED_SERVERS_ID usando a função loadCommand
    *  !!! Lembre sempre de alterar o nome contido na segunda etapa para cada novo comando !!!
    */

    // Comando de invite: cria um invite que pode ser vinculado a um cargo para que
    // ele atribua o cargo vinculado a cada uso.
    console.log(`${Date()} LOG - Iniciando registro de comandos`);

    function loadCommand(commandName, command) {
        for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
            try {
                client.application.commands.create(command, id).then(_ => console.log(`${Date()} COMANDOS - ${commandName} cadastrado em: ${id}`));
            } catch (error) {
                console.log(`${Date()} ERRO - ${commandName} não cadastrado em: ${id}\n${error}`);
            }
        }
    }

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
        )
        .addIntegerOption(option =>
            option.setName('uses')
                .setDescription('Número máximo de usos (0 para ilimitado)')
                .setRequired(false)
        );
    loadCommand('invite', invite);

    // Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
    const ping = await new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Responde com Pong!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    loadCommand('ping', ping);

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
        )
    loadCommand('echo', echo);

    // Display serve para exibir os convites ativos do servidor
    const display = await new SlashCommandBuilder()
        .setName("display")
        .setDescription("Exibe os convites ativos do servidor")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    loadCommand('display', display);

    // Poll serve para criar uma enquete com embed
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
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('Primeira opção')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Segunda opção')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Terceira opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Quarta opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Quinta opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option6')
                .setDescription('Sexta opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option7')
                .setDescription('Setima opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option8')
                .setDescription('Oitava opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option9')
                .setDescription('Nona opção')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option10')
                .setDescription('Décima opção')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('allow-multiselect')
                .setDescription('Permite múltipla seleção de opções (padrão: 0 para false)')
                .setRequired(false));
    loadCommand('poll', poll);
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
                // Pega o canal especificado ou usa o canal atual
                const channel = interaction.options.getChannel('channel') || interaction.channel;
                const duration = interaction.options.getInteger('duration') || 0;
                const maxUses = interaction.options.getInteger('uses') || 0;
                const role = interaction.options.getRole('role').name;

                // Cria o convite
                const invite = await channel.createInvite({
                    maxAge: duration * 86400, // Converte dias para segundos
                    maxUses: maxUses,
                    unique: true
                });

                db.query(`INSERT INTO invites (invite, role, server_id) VALUES ('${invite.code}', '${role}', '${interaction.guild.id}')`);

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
                db.query(`SELECT * FROM invites WHERE server_id = '${interaction.guild.id}'`, async (err, rows) => {
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

                const poll_id = await interaction.channel.send({
                    poll: {
                        question: {text: question},
                        answers: pollAnswers,
                        allowMultiselect: multiselect,
                        duration: duration,
                        layoutType: PollLayoutType.Default
                    }
                });

                filteredOptions =  filteredOptions.map(answer => [answer, 0]) // Cria um array de respostas com o texto e a contagem de votos inicializada em 0

                db.query(`INSERT INTO polls (poll_id, poll_json) VALUES ('${poll_id.id}', '${JSON.stringify({question: question, answers: filteredOptions, duration: duration})}')`, (err) => {
                    if (err) {
                        console.error(`${Date()} ERRO - Erro ao inserir enquete no banco de dados:`, err);
                        client.channels.cache.get(interaction.channel.id).messages.delete(poll_id);
                        return interaction.reply({
                            content: "❌ Ocorreu um erro ao armazenar a enquete.",
                            ephemeral: true
                        });
                    }
                    return interaction.reply({
                        content: "✅ Enquete criada com sucesso!",
                        ephemeral: true
                    });
                })
            } catch (error) {
                console.error(`${Date()} ERRO - Falha ao criar enquete:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao criar a enquete.",
                    ephemeral: true
                });
            }
            break;

        default:
            break;
    }
});



// Evento que é disparado quando alguém vota em uma enquete
client.on('raw', async (packet) => {
    if (['MESSAGE_POLL_VOTE_ADD', 'MESSAGE_POLL_VOTE_REMOVE'].includes(packet.t)) {
        let adder = (packet.t == 'MESSAGE_POLL_VOTE_ADD') ? 1 : -1;
        let moment;
        try {
            const poll_id = await packet.d.message_id;
            const user = await client.users.fetch(packet.d.user_id);
            db.query(`SELECT poll_json FROM polls WHERE poll_id = '${poll_id}'`, async (err, row) => {
                moment = row[0].poll_json;
                console.log(moment)
                moment.answers[packet.d.answer_id - 1][1] += (adder);
                console.log(moment)
            })
            db.query(`UPDATE polls SET poll_json = '${JSON.stringify(moment)}' WHERE poll_id = '${poll_id}'`);
            console.log(`${Date()} LOG - ${user.username} votou em ${poll_id}`);
        } catch (error) {
            console.error(`${Date()} ERRO - Falha ao processar voto:`, error);
        }
    }
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
        bot_db.query(
            "SELECT role FROM invites WHERE invite = ?",
            [used_invite],
            async (err, rows) => {
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