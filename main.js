// Importa as dependencias
import dotenv from 'dotenv'
dotenv.config();
import {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    PollLayoutType,
    TextChannel,
    ForumChannel,
    AttachmentBuilder,
    ChannelType,
    MessageFlags
} from "discord.js"
import mysql from 'mysql2'
import {
    somePermissionsChannels,
    allPermissionsChannels,
    classActivations,
    classChannels,
    classRolePermissions
} from "./data/classPatterns.mjs"
import {slashCommands} from "./data/slashCommands.mjs"
import {defaultRoles} from "./data/defaultRoles.mjs"
import {defaultTags} from "./data/defaultTags.mjs";
import {Canvas, createCanvas, Image, loadImage, GlobalFonts} from '@napi-rs/canvas'
import {request}  from 'undici'

GlobalFonts.registerFromPath("./data/Coolvetica Hv Comp.otf", "normalFont")

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
async function dbConnect(database) {
    global.db = database.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQLDATABASE,
        waitForConnections: true
    });

    db.connect((err) => {
        if (err) {
            console.error('ERRO - Erro ao conectar no MySQL:', err);
            process.exit(1); // Encerra o processo se não conseguir conectar ao banco de dados para tentar novamente
        }
    });
}

//await dbConnect(mysql);

// Cria a tabela de convites, caso não exista
async function initializeTables() {
    try {
        // Cria a tabela de convites
        db.query(`
            CREATE TABLE IF NOT EXISTS invites (
                invite VARCHAR(16) PRIMARY KEY NOT NULL,
                role VARCHAR(32) NOT NULL,
                server_id VARCHAR(22) NOT NULL
            )
        `);
        console.info('LOG - Tabela de convites verificada com sucesso');

        // Cria a tabela de enquetes
        db.query(`
            CREATE TABLE IF NOT EXISTS polls (
                poll_id VARCHAR(22) PRIMARY KEY NOT NULL,
                poll_json JSON NOT NULL,
                ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.info('LOG - Tabela de enquetes verificada com sucesso');
    } catch (err) {
        console.error('ERRO - Erro ao inicializar tabelas:', err);
        process.exit(1); // Encerra o processo se não conseguir criar as tabelas
    }
}

//await initializeTables();



// Fila global para processamento diverso
class Queue {
    constructor(maxConcurrent = 1) {
        this.items = [];
        this.running = 0;
        this.maxConcurrent = maxConcurrent;
    }

    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.items.push({
                ...task,
                _resolve: resolve,
                _reject: reject
            });
            this.process();
        });
    }

    async process() {
        if (this.running >= this.maxConcurrent) return;
        if (this.items.length === 0) return;

        const task = this.items.shift();
        this.running++;

        try {
            if (task.processData && typeof task.processData === "function") {
                await task.processData();
            } else {
                console.warn("Tarefa inválida:", task);
            }
            task._resolve();
        } catch (err) {
            task._reject(err);
            console.error("Erro na fila:", err);
        } finally {
            this.running--;
            this.process();
        }

        this.running--;
        this.process();
    }
}

// Cria a única fila global
const globalQueue = new Queue(Number(process.env.MAX_CONCURRENT)); // ajusta concorrência definida no .env (1 é recomendado, se velocidade se tornar mais necessária pode-se aumentar esse valor)


// Comando que é executado a cada determinado espaço de tempo
let eventsSchedule = []
async function checkEvents() {
    try {
        const guilds = await client.guilds.fetch();

        const now = new Date(); // timestamp atual em ms

        if (eventsSchedule.length === Number(process.env.MAX_EVENTS_CACHE)) eventsSchedule.shift() // remove o primeiro item da lista

        for (const [id, partialGuild] of guilds) {
            try {
                // força o fetch completo da guild
                const guild = await partialGuild.fetch();
                const events = await guild.scheduledEvents.fetch();
                for (const event of events.values()) {
                    const now = Date.now(); // timestamp atual em ms
                    const diffMs = event.scheduledStartTimestamp - now;

                    if (diffMs > 0) { // evento ainda não começou
                        const diffMinutes = Math.floor(diffMs / 1000 / 60);
                        if (diffMinutes <= 30 && !eventsSchedule.includes(event.id) && [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(event.channel.type)) {
                            // Define qual o canal que deve ser enviado o aviso
                            const channels = await guild.channels.fetch(); // pega todos os canais
                            const eventChannel = channels.get(event.channelId); // pega o canal do evento
                            const target = channels.find(c =>
                                c.parentId === eventChannel.parentId &&
                                c.name === classChannels[1].name
                            );

                            // Pega o cargo da turma do evento
                            const overwrites = eventChannel.permissionOverwrites.cache
                                .filter(o => o.type === 0); // só cargos

                            let classRole = await Promise.all(
                                overwrites.map(async o => {
                                    const role = await guild.roles.fetch(o.id);
                                    return role.name.includes("Estudantes "+eventChannel.parent.name) ? role : null;
                                })
                            );

                            classRole = classRole.filter(r => r !== null)[0];

                            // Pega a hora do evento
                            const date = new Date(event.scheduledStartTimestamp);
                            const hours = date.toLocaleString("pt-BR", {
                                timeZone: "America/Sao_Paulo",
                                hour: "2-digit",
                                minute: "2-digit"
                            });

                            target.send(`Boa noite, turma!!  ${classRole}\n` +
                                "\n" +
                                `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀 \n` +
                                `acesse o card do evento [aqui](${event.url})`)

                            // Adiciona o evento na lista de eventos agendados para evitar duplicidade
                            eventsSchedule.push(event.id)
                        }
                    }
                }

            } catch (err) {console.error(`Erro ao buscar eventos da guild ${id}:`, err);}
        }
    } catch (err) {
        console.error("Erro na rotina:", err)
    } finally {
        // agenda de novo só depois que terminar tudo
        setTimeout(checkEvents, Number(process.env.EVENT_CHECK_TIME) * 60 * 1000);
    }
}



// Fecha o banco na saída do processo
/* process.on('SIGINT', () => {
    db.end(err => {
        if (err) {
            console.error('Erro ao fechar a conexão com o MySQL:', err);
        } else {
            console.info('Conexão com o MySQL fechada');
        }
        process.exit(0);
    })
}) */



// Define o que o bot deve fazer ao ser iniciado, no caso, imprime uma mensagem de online e cria os comandos existentes
client.once(Events.ClientReady, async c => {
    console.info(`LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);

    // Começa o cadastro de comandos nos servidores
    async function loadCommand(commandName, command) {
        const serverIds = process.env.ALLOWED_SERVERS_ID.split(',');

        // Cria todas as promises em paralelo por servidor
        const promises = serverIds.map(async (id) => {
            try {
                await client.application.commands.create(command, id);
                console.info(`COMANDO - "${commandName}" cadastrado em servidor ${id}`);
            } catch (error) {
                console.error(`ERRO - "${commandName}" não cadastrado em servidor ${id}\n`, error);
            }
        });

        // Espera todas terminarem
        await Promise.all(promises);
    }

// Cadastra todos os comandos em paralelo
    await Promise.all(
        slashCommands.map(c => loadCommand(c.name, c.commandBuild))
    );

    // Inicia o processo de checagem de eventos nos servidores
    checkEvents();
});



// Interações com os comandos
client.on(Events.InteractionCreate, async interaction => {
    switch (interaction.commandName) {
        case "ping":
            await interaction.reply({content: "pong!", flags: MessageFlags.Ephemeral});
            console.info(`LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
            break;

        /* case "invite":
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

                // Insere o convite no banco de dados
                db.query(`INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`, [invite.code, role, interaction.guild.id]);

                // Responde com o link do convite
                await interaction.reply({
                    content: `✅ Convite criado com sucesso!\n📨 Link: ${invite.url}\n📍 Canal: ${channel}\n⏱️ Duração: ${duration === 0 ? 'Permanente' : `${duration} dias`}\n🔢 Usos máximos: ${maxUses === 0 ? 'Ilimitado' : maxUses}\n👥 Cargo vinculado: ${role}`,
                    flags: MessageFlags.Ephemeral // Faz a resposta ser visível apenas para quem executou o comando
                }).then(_ => console.info(`LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`));
            } catch (error) {
                console.error(`Erro ao criar convite:`, error);
                await interaction.reply({
                    content: `❌ Ocorreu um erro ao criar o convite. Verifique se tenho permissões suficientes.\n` + "```" + error + "```",
                    flags: MessageFlags.Ephemeral
                });
            }
            break; */

        case "echo":
            let message = interaction.options.getString("message")
            const echoChannel = interaction.options.getChannel("channel", true);
            if (!echoChannel.isTextBased()) {
                await interaction.reply({
                    content: "❌ O canal especificado não é um canal de texto.",
                    flags: MessageFlags.Ephemeral
                });
                return;
            } else {
                await echoChannel.send(message).then(_ => {
                    interaction.reply({
                        content: `✅ Mensagem enviada para ${echoChannel} com sucesso!`,
                        flags: MessageFlags.Ephemeral
                    });
                    console.info(`LOG - echo ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
                }).catch(error => {
                    console.error(`ERRO - Falha ao enviar mensagem:`, error);
                    interaction.reply({
                        content: "❌ Ocorreu um erro ao enviar a mensagem.\n" + "```" + error + "```",
                        flags: MessageFlags.Ephemeral
                    });
                });
            }
            break;

        /* case "display":
            try {
                // Busca os convites ativos do servidor
                db.query(`SELECT * FROM invites WHERE server_id = ?`, [interaction.guild.id], async (err, rows) => {
                    if (err) {
                        console.error(`ERRO - Erro na consulta SQL:`, err);
                        await interaction.reply({
                            content: "❌ Ocorreu um erro ao buscar os convites.",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    // Verifica se há convites no banco de dados
                    if (rows.length === 0) {
                        await interaction.reply({
                            content: "Nenhum convite ativo encontrado.",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    // Verifica os convites existentes
                    rows.forEach(invite => {
                        interaction.guild.invites.fetch().then(invites => {
                            if (!invites.has(invite.invite)) {
                                db.query(`DELETE FROM invites WHERE invite = ?`, [invite.invite], (err) => {
                                    if (err) {
                                        console.error(`ERRO - Erro ao remover convite inválido:`, err);
                                    } else {
                                        console.info(`LOG - Convite inválido removido: ${invite.invite}`);
                                    }
                                });
                            }
                        }).catch(err => {
                            console.error(`ERRO - Falha ao buscar convites do servidor:`, err);
                        });
                    })

                    // Formata a resposta com os convites
                    let response = "Convites ativos:\n";
                    rows.forEach(invite => {
                        response += `- **${invite.role}:** https://discord.gg/${invite.invite}\n`;
                    });
                    await interaction.reply({
                        content: response,
                        flags: MessageFlags.Ephemeral
                    });
                });
                break;
            } catch (error) {
                console.error(`ERRO - Falha ao buscar convites:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao buscar os convites.\n"  + "```" + error + "```",
                    flags: MessageFlags.Ephemeral
                });
            }
            break; */

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

                await interaction.reply({content: "✅ Enquete criada com sucesso!", flags: MessageFlags.Ephemeral});

            } catch (error) {
                console.error(`ERRO - Falha ao criar enquete:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao criar a enquete.\n" + error,
                    flags: MessageFlags.Ephemeral
                });
            }
            break;

        /* case "createclass":
            await interaction.deferReply({flags: MessageFlags.Ephemeral}); // Responde de forma atrasada para evitar timeout

            const className = interaction.options.getString('name');

            async function createInvite(targetRole, targetChannel) {
                try{
                    const invite = await targetChannel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                        unique: true
                    });

                    // Insere o convite no banco de dados
                    await new Promise((resolve, reject) => {
                        db.query(
                            `INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`,
                            [invite.code, targetRole.id, interaction.guild.id],
                            (err, result) => {
                                if (err) return reject(err);
                                resolve(result);
                            }
                        );
                    });

                    return invite.url;
                } catch (error) {
                    console.error(`ERRO - Não foi possível criar o convite\n${error}`);
                    return "";
                }
            }

            try {
                const classRole = await interaction.guild.roles.create({
                    name: `Estudantes ${className}`,
                    color: 3447003,
                    mentionable: true, // Permite que o cargo seja mencionado
                    hoist: true, // Exibe o cargo na lista de membros
                    permissions: classRolePermissions
                });

                const serverChannels = await interaction.guild.channels.fetch()
                for (const channel of serverChannels.values()) {
                    if ([...somePermissionsChannels, interaction.options.getChannel('faq-channel').name].includes(channel.name)) { // Ignora canais não especificados no arquivo de configuração
                        await channel.permissionOverwrites.edit(classRole, {
                            SendMessages: false,
                            ViewChannel: true,
                            ReadMessageHistory: true,
                            AddReactions: true
                        });
                    } else if (allPermissionsChannels.includes(channel.name)) {
                        await channel.permissionOverwrites.edit(classRole, {
                            SendMessages: true,
                            ViewChannel: true,
                            ReadMessageHistory: true,
                            AddReactions: true
                        });
                    }
                }

                const roles = await interaction.guild.roles.fetch();
                let inviteChannel = await interaction.guild.channels.fetch();
                inviteChannel = inviteChannel.find(channel => channel.name === "✨│boas-vindas")

                const new_RolesForNewClasses = await Promise.all(
                    defaultRoles.rolesForNewClasses.map(async (obj) => {
                        const role = obj.name === "className"
                            ? roles.find(r => r.name === `Estudantes ${className}`)
                            : roles.find(r => r.name === obj.name);

                        return {
                            id: role.id, // aqui vira id mesmo
                            allow: obj.permissions //.map(p => PermissionFlagsBits[p.toUpperCase()]) // convertendo permissões
                        };
                    })
                );

                const classCategory = await interaction.guild.channels.create({
                    name: className,
                    type: 4, // Categoria
                    permissionOverwrites: new_RolesForNewClasses,
                });

                for (const channel of classChannels) {
                    const target = await interaction.guild.channels.create({
                        name: channel.name,
                        type: channel.type,
                        position: channel.position,
                        parent: classCategory.id // Define a categoria da turma
                    })
                    if (channel.name === "❓│dúvidas") {
                        await target.setAvailableTags(defaultTags);
                        await Promise.all(classActivations.map(async (activate) => {
                            if (activate.content.includes("{mention}")) {
                                activate.content = activate.content.replace("{mention}", `${classRole}`);
                            }
                            await target.threads.create({
                                name: activate.title,
                                message: {content: activate.content}
                            });
                        }));
                    } else if ([classChannels[1].name, classChannels[4].name].includes(channel.name)) {
                        await target.edit({permissionOverwrites: [{id: classRole, deny: ["SendMessages"], allow: ["ViewChannel"]}]})
                    } else if ([classChannels[6].name, classChannels[7].name].includes(channel.name)) {
                        await target.edit({name: channel.name+className})
                    }
                }

                    // Cria o convite
                    const inviteUrl = await createInvite(classRole, inviteChannel) || "Erro no momento de criação do invite";

                    // Responde com o link do invite e outras informações
                    await interaction.editReply({
                        content: `✅ Turma ${className} criado com sucesso!\n📨 Link: ${inviteUrl}\n👥 Cargo vinculado: ${classRole}`,
                        flags: MessageFlags.Ephemeral
                    }).then(_ => console.info(`LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`));
                } catch (error) {
                    console.error(`ERRO - Não foi possivel criar a turma\n${error}`);
                    await interaction.editReply({
                        content: `❌ Erro ao criar ${className}\n` + "```" + error + "```",
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            break; */

        case "extract":
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = interaction.channel;
            let allMessages = new Map();
            let lastId;

            // Busca todas as mensagens em lotes de 100
            while (true) {
                const options = { limit: 100 };
                if (lastId) options.before = lastId;
                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;
                messages.forEach(message => allMessages.set(message.id, message));
                lastId = messages.last().id;
            }

            // Ordena as mensagens em ordem cronológica e inclui apenas as que têm conteúdo de texto
            const sortedMessages = Array.from(allMessages.values())
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                .filter(msg => {
                    const content = msg.content.trim();
                    if (!content) return false;
                    // Ignora mensagens com formatação/markup indesejado
                    if (content.includes('\\-\\-boundary') ||
                        content.includes('Content-Disposition') ||
                        content.startsWith('poll:') ||
                        /^<t:\d+(:[a-zA-Z])?>$/.test(content))
                        return false;
                    return true;
                });

            // Formata as mensagens com data, usuário e mensagem
            let output = "";
            sortedMessages.forEach(msg => {
                output += `[${msg.createdAt.toLocaleString("pt-BR")}] ${msg.author.tag}: ${msg.content}\n\n`;
            });

            const textBuffer = Buffer.from(output, "utf-8");
            const fileAttachment = new AttachmentBuilder(textBuffer, { name: "chat_history.txt" });

            await interaction.editReply({ content: "Histórico coletado:", files: [fileAttachment] });
            break;

        default:
            break;
    }
});



// Evento que é disparado quando uma enquete termina
/*client.on('raw', async (packet) => {
    if (!packet.t || !['MESSAGE_UPDATE'].includes(packet.t)) return;
    if (packet.d.poll.results.is_finalized) {
        const pollData = packet.d;
        globalQueue.enqueue({processData: async () => {
            try {
                const d1 = new Date(pollData.poll.expiry.slice(0, 23));
                const d2 = new Date(pollData.timestamp.slice(0, 23));
                let poll_json = {
                    question: pollData.poll.question.text,
                    answers: pollData.poll.answers.map(answer => [
                        answer.poll_media.text,
                        pollData.poll.results.answer_counts.map(count => count.count)[answer.answer_id - 1]
                    ]),
                    duration: `${((d1-d2)/1000/60/60).toFixed(0)}:${((d1 - d2)/1000/60).toFixed(0)}:${((d1 - d2)/1000).toFixed(0)}`
                };
                await db.promise().query(
                    'INSERT INTO polls (poll_id, poll_json) VALUES (?, ?)',
                    [pollData.id, JSON.stringify(poll_json)]
                );
            } catch (err) {
                console.error("Erro ao processar poll:", err);
            }
        }});
    }
}); */



// Evento que é disparado quando um novo membro entra no servidor
/* client.on(Events.GuildMemberAdd, async member => {
    globalQueue.enqueue({processData: async () => {
        try {
            console.info(`LOG - Processando entrada de ${member.user.username}`);

            // Constroi e envia uma imagem de boas-vindas
            async function sendWelcome(profile, targetChannel) {
                const canvas = createCanvas(1401, 571);
                const context = canvas.getContext('2d');

                const background = await loadImage('./data/wallpaper.png');

                // Cria um buffer com a imagem do usuário
                const avatarUrl = profile.displayAvatarURL({ extension: 'png', size: 512 });
                const { body } = await request(avatarUrl);
                const avatarBuffer = Buffer.from(await body.arrayBuffer());
                const avatar = await loadImage(avatarBuffer);

                // Insere o fundo e corta a foto de perfil do usuário em formato de círculo
                context.drawImage(background, 0, 0, canvas.width, canvas.height);
                context.save();
                context.beginPath();
                context.arc(285, 285, 256, 0, Math.PI * 2, true);
                context.closePath();
                context.clip();
                context.drawImage(avatar, 29, 29, 512, 512);
                context.restore();

                // Insere uma mensagem de boas-vindas que utiliza o nome do usuário
                context.font = '150px normalFont';
                context.fillStyle = '#ffffff';
                context.fillText('Bem vindo!', 512+100, (canvas.height - 150+150)/2);
                context.fillText(`${profile.displayName}`, 512+100, (canvas.height - 150+150)/2+150);

                const pngBuffer = Buffer.from(await canvas.encode('png'));
                const attachment = new AttachmentBuilder(pngBuffer, { name: 'profile-image.png' });

                targetChannel.send({ files: [attachment] });
            }

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
                console.error(`ERRO - Não foi possível determinar o convite usado`);
                return;
            }

            // Busca o cargo vinculado ao invite no banco
            db.query("SELECT role FROM invites WHERE invite = ?", [used_invite], async (err, rows) => {
                    if (err) {
                        console.error(`ERRO - Erro na consulta SQL:`, err);
                        return;
                    }

                    // Verifica se há resultados
                    if (!rows || rows.length === 0) {
                        console.error(`ERRO - Nenhum cargo vinculado ao convite usado`);
                        return;
                    }

                    const welcome_role = await member.guild.roles.cache.find(role => role.name === rows[0].role);
                    if (!welcome_role) {
                        console.error(`ERRO - Cargo ${rows[0].role} não encontrado no servidor`);
                        return;
                    }

                    await member.roles.add(welcome_role);
                    console.info(`LOG - ${member.user.username} adicionado ao cargo ${welcome_role.name}`);
                }
            );

            // Registra o log de entrada do membro
            console.info(`LOG - ${member.user.username} entrou no servidor ${member.guild.name} com o código: ${used_invite}`);

            // Busca o canal de boas-vindas e envia a mensagem
            try {
                const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === "✨│boas-vindas");
                if (welcomeChannel) {
                    //await welcomeChannel.send(`Olá ${member}, seja bem-vindo(a) a comunidade!`);
                    await sendWelcome(member, welcomeChannel);
                }} catch (error) {
                console.error(`ERRO - Falha ao enviar mensagem de boas-vindas:`, error);
            }

        } catch (error) {
            console.error(`ERRO ao processar novo membro:`, error);
        }
    }});
}); */



try {
    await client.login(process.env.TOKEN);
} catch (error) {
    console.error(`ERRO - Bot não iniciado\n${error}`);
}