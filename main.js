// Importa as dependencias
require('dotenv').config();
const {Client, Events, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle} = require("discord.js");
const mysql = require('mysql2');

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
                    server_id VARCHAR(22) NOT NULL)`,
    (err) => {
    if (err) {
        console.error('Erro ao criar tabela:', err);
    }
});

// Define os principais acessos que o Bot precisa para poder funcionar corretamente
const client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessagePolls
    ]});

// Define o que o bot deve fazer ao ser iniciado, no caso, imprime uma mensagem de online e cria os comandos existentes
client.once(Events.ClientReady, async c => {
    console.log(`${Date()} LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);

    console.log(`${Date()} LOG - Iniciando registro de comandos`);

    /* Cada comando é seguido pela ordem:
    *  1. Declaração (const) usando await
    *  2. Registro nos servidores contidos em ALLOWED_SERVERS_ID usando o loop for
    *  !!! Lembre sempre de alterar o nome contido na segunda etapa para cada novo comando !!!
    */

    // Comando de invite: cria um invite que pode ser vinculado a um cargo para que
    // ele atribua o cargo vinculado a cada uso.
    const [invite] = await Promise.all([new SlashCommandBuilder()
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
        )])
    for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
        try {
            client.application.commands.create(invite, id).then(_ => console.log(`${Date()} COMANDOS - invite cadastrado em: ${id}`));
        } catch (error) {
            console.log(`${Date()} ERRO - invite não cadastrado em: ${id}\n${error}`);
        }
    }

    // Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
    const ping = await new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Responde com Pong!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
        try {
            client.application.commands.create(ping, id).then(_ => console.log(`${Date()} COMANDOS - ping cadastrado em: ${id}`))
        } catch (error) {
            console.log(`${Date()} ERRO - ping não cadastrado em: ${id}\n${error}`)
        }
    }

    // Echo serve para replicar uma mensagem para um ou mais canais definidos pelo usuário
    const echo = await new SlashCommandBuilder()
        .setName("echo")
        .setDescription("Replica uma mensagem para determinado canal")
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
    for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
        try {
            client.application.commands.create(echo, id).then(_ => console.log(`${Date()} COMANDOS - echo cadastrado em: ${id}`))
        } catch (error) {
            console.log(`${Date()} ERRO - echo não cadastrado em: ${id}\n${error}`)
        }
    }

    // Display serve para exibir os convites ativos do servidor
    const display = await new SlashCommandBuilder()
        .setName("display")
        .setDescription("Exibe os convites ativos do servidor")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
        try {
            client.application.commands.create(display, id).then(_ => console.log(`${Date()} COMANDOS - display cadastrado em: ${id}`))
        } catch (error) {
            console.log(`${Date()} ERRO - display não cadastrado em: ${id}\n${error}`)
        }
    }

    // Poll serve para criar uma enquete com embed
    const poll = await new SlashCommandBuilder()
            .setName('poll')
            .setDescription('Cria uma enquete interativa')
            .addStringOption(option =>
                option.setName('titulo')
                    .setDescription('Título da enquete')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('descricao')
                    .setDescription('Descrição da enquete')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('duracao')
                    .setDescription('Duração da enquete em horas (padrão: 24)')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('opcao1')
                    .setDescription('Primeira opção')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('opcao2')
                    .setDescription('Segunda opção')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('opcao3')
                    .setDescription('Terceira opção')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('opcao4')
                    .setDescription('Quarta opção')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('opcao5')
                    .setDescription('Quinta opção')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

        for (const id of process.env.ALLOWED_SERVERS_ID.split(',')) {
        try {
            client.application.commands.create(poll, id).then(_ => console.log(`${Date()} COMANDOS - poll cadastrado em: ${id}`))
        } catch (error) {
            console.log(`${Date()} ERRO - poll não cadastrado em: ${id}\n${error}`)
        }
    }
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
                const titulo = interaction.options.getString('titulo');
                const descricao = interaction.options.getString('descricao') || '';
                const opcoes = interaction.options.getString('opcoes')
                    .split(',')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);

                if (opcoes.length > 10) {
                    return await interaction.reply({
                        content: 'Você só pode ter no máximo 10 opções!',
                        ephemeral: true
                    });
                }

                if (opcoes.length < 2) {
                    return await interaction.reply({
                        content: 'Você precisa fornecer pelo menos 2 opções!',
                        ephemeral: true
                    });
                }

                // Emojis numerados de 1 a 10
                const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

                // Criar o texto da enquete
                let pollDescription = descricao ? `${descricao}\n\n` : '';
                pollDescription += opcoes
                    .map((opt, index) => `${numberEmojis[index]} ${opt}`)
                    .join('\n\n');

                const pollEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('📊 ' + titulo)
                    .setDescription(pollDescription)
                    .setFooter({
                        text: `Enquete criada por ${interaction.user.username}`
                    });

                // Enviar a mensagem da enquete
                const pollMessage = await interaction.channel.send({
                    embeds: [pollEmbed]
                });

                // Adicionar as reações
                for (let i = 0; i < opcoes.length; i++) {
                    await pollMessage.react(numberEmojis[i]);
                }

                await interaction.reply({
                    content: 'Enquete criada com sucesso!',
                    ephemeral: true
                });

            } catch (error) {
                console.error('Erro ao criar enquete:', error);
                await interaction.reply({
                    content: 'Ocorreu um erro ao criar a enquete!',
                    ephemeral: true
                })}
            break;

        default:
            break;
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