// Importa as dependencias
require('dotenv').config();
const {Client, Events, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits} = require("discord.js");
const mysql = require('mysql2');

// Debug
console.log(process.env);

// Conexão com o banco de dados MySQL
const bot_db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQLDATABASE
});

bot_db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL!');
});

// Cria a tabela de convites, caso não exista
bot_db.query(`CREATE TABLE IF NOT EXISTS invites (
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
        GatewayIntentBits.GuildInvites
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
        )
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
});

// Interações com os comandos
client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    
    if(interaction.commandName === "ping"){
        await interaction.reply({content: "pong!", ephemeral: true}).then(_ => console.log(`LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`));
    }

    else if(interaction.commandName === "invite") {
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

            bot_db.query(`INSERT INTO invites (invite, role, server_id) VALUES ('${invite.code}', '${role}', '${interaction.guild.id}')`);

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
    }

    else if(interaction.commandName === "echo") {
        const message = interaction.options.getString("Message")
        const channel = interaction.options.getChannel("channel", true);


    }
});

// Evento que é disparado quando um novo membro entra no servidor
client.on(Events.GuildMemberAdd, async member => {

    // Registra o log de entrada do membro
    console.log(`LOG - ${(member.user.username)} entrou no serivor ${member.guild.name} com o código: ${await member.guild.invites.fetch().then(invites => invites.first().code)}`);

    // Busca o canal de boas vindas e envia a mensagem de boas vindas ao novo membro
    const welcomeChannel = await member.guild.channels.cache.find(channel => channel.name === "✨│boas-vindas");
    await welcomeChannel.send(`Olá ${member}, seja bem-vindo(a) a comunidade!`);

    // Busca se há algum cargo vinculado ao invite no banco de dados e adiciona ao novo membro
    try {
        bot_db.query(
            "SELECT role FROM invites WHERE server_id = ?",
            [member.guild.id],
            async (err, row) => {
                if (err) {
                    console.error('ERRO - Erro na consulta SQL:', err);
                    return;
                }

                if (!row) {
                    console.log('ERRO - Nenhum cargo vinculado ao convite usado');
                    return;
                }

                const welcome_role = await member.guild.roles.cache.find(role => role.name === row.role);
                if (!welcome_role) {
                    console.log('ERRO - Cargo não encontrado no servidor');
                    return;
                }

                await member.roles.add(welcome_role).then(_ => console.log(`LOG - ${member.user.username} adicionado ao cargo ${welcome_role.name}`));
            }
        );
    } catch (error) {
        console.error('ERRO - Erro ao adicionar cargo:', error);
    }
})

try {
    client.login(process.env.TOKEN).then(_ => console.log(`${Date()}`));

} catch (error) {
    console.log(`${Date()} ERRO - Bot não iniciado\n${error}`);
}