// Importa as dependencias
import dotenv from 'dotenv'
dotenv.config();
import {
    Client,
    Events,
    GatewayIntentBits,
    PermissionFlagsBits,
    PollLayoutType,
    AttachmentBuilder,
    MessageFlags
} from "discord.js"
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
import {createCanvas, loadImage, GlobalFonts} from '@napi-rs/canvas'
import {request}  from 'undici'
import {localDataBaseConnect, remoteDataBaseConnect} from "./data/database.mjs"

// Registra a fonte usada na imagem de boas-vindas
GlobalFonts.registerFromPath("./data/Coolvetica Hv Comp.otf", "normalFont")

// Define os acessos que o Bot precisa para poder funcionar corretamente
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.GuildMessageReactions
    ]
});



// Conecta aos bancos de dados
const localDataBase = await new localDataBaseConnect();
//const remoteDataBase = await new remoteDataBaseConnect();



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

const globalQueue = new Queue(Number(process.env.MAX_CONCURRENT)); // ajusta concorrência definida no .env (1 é recomendado, se velocidade se tornar mais necessária pode-se aumentar esse valor)


// Cache de convites cadastrados no banco de dados (cache aside) para economizar requests ao banco de dados
let cachedInvites = {};

// Função executada no inicio para carregar os convites do banco de dados no cache
async function getCachedInvites(cache) {
    const rows = await localDataBase.getAllInvites()
    rows.forEach(row => cache[row.invite] = [row.role, row.server_id]);
}
await getCachedInvites(cachedInvites);
console.log(`DEBUG - Convites carregados do banco de dados para o cache\n${JSON.stringify(cachedInvites, null, 2)}`);


// Lista de todos os eventos que já foram avisados (para evitar duplicidade)
let eventsSchedule = []

// Comando que é executado a cada determinado espaço de tempo
async function checkEvents() {
    // Pega todos os servidores em que o bot está
    const guilds = await client.guilds.fetch();

    // Remove o primeiro item da lista quando ela atinge um limite determinado
    if (eventsSchedule.length === Number(process.env.MAX_EVENTS_CACHE)) eventsSchedule.shift()

    for (const [id, partialGuild] of guilds) {
        try {
            // força o fetch completo da guild
            const guild = await partialGuild.fetch();

            // Pega todos os eventos cadastrados no servidor
            const events = await guild.scheduledEvents.fetch();

            for (const event of events.values()) {

                // timestamp atual em ms
                const now = Date.now();

                // Calcula a diferença de tempo entre o evento e o momento atual
                const diffMs = event.scheduledStartTimestamp - now;

                // Diferença em minutos
                const diffMinutes = Math.floor(diffMs / 1000 / 60);

                // verifica se o evento ainda não começou e se ele não está na lista de eventos já avisados
                if (diffMinutes > 0 && diffMinutes <= Number(process.env.EVENT_DIFF_FOR_WARNING) && !eventsSchedule.includes(event.id)) {

                    // Pega todos os canais do servidor
                    const channels = await guild.channels.fetch();

                    if (event.channelId === null) {
                        // Filtra os canais do servidor para os canais de avisos envia o aviso neles todos
                        const avisoChannels = channels.filter(c => c.type === 0 && c.name === classChannels[1].name);
                        for (const [, channel] of avisoChannels) {
                            if (!channel.isTextBased()) {
                                console.warn(`Aviso ignorado: canal ${channel.id} não é de texto.`);
                                continue;
                            }
                            // Pega os cargos do canal
                            const overwrites = channel.permissionOverwrites.cache.filter(o => o.type === 0); // só cargos

                            // Determina qual o cargo da turma vendo todos os cargos do servidor e filtrando pelo nome da categoria (que sempre deve ser a sigla da turma)
                            const parentName = channel.parent?.name ?? null;
                            if (!parentName) {
                                console.warn(`Aviso ignorado: canal ${channel.id} sem categoria (parent null).`);
                                continue;
                            }
                            const roles = await Promise.all(
                                overwrites.map(async o => {
                                    const role = await guild.roles.fetch(o.id).catch(() => null);
                                    return role && role.name?.includes("Estudantes " + parentName) ? role : null;
                                })
                            );
                            const classRole = roles.find(r => r !== null);

                            // Pega a hora do evento
                            const date = new Date(event.scheduledStartTimestamp);
                            const hours = date.toLocaleString("pt-BR", {
                                timeZone: "America/Sao_Paulo",
                                hour: "2-digit",
                                minute: "2-digit"
                            });

                            await channel.send(
                                `Boa noite, turma!!  ${classRole ? classRole.toString() : ""}\n` +
                                "\n" +
                                `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀 \n` +
                                `acesse o card do evento [aqui](${event.url})`
                            );

                            // Adiciona o evento na lista de eventos agendados para evitar duplicidade
                            eventsSchedule.push(event.id)
                        }
                    }
                    else {
                            // Encontra o canal do evento
                            const eventChannel = channels.get(event.channelId);

                            // Encontra o canal de avisos
                            const target = channels.find(c =>
                                c.parentId === eventChannel.parentId && // Nome da classe
                                c.name === classChannels[1].name // Nome do canal de avisos
                            );

                            // Pega o cargo da turma do evento
                            const overwrites = await eventChannel.permissionOverwrites.cache.filter(o => o.type === 0); // só cargos

                            // Determina qual o cargo da turma vendo todos os cargos do servidor e filtrando pelo nome da categoria (que sempre deve ser a sigla da turma)
                            let classRole = await Promise.all(
                                overwrites.map(async o => {
                                    const role = await guild.roles.fetch(o.id);
                                    return role.name.includes("Estudantes " + eventChannel.parent.name) ? role : null;
                                })
                            );

                            // Filtra os cargos vazios
                            classRole = classRole.filter(r => r !== null)[0];

                            // Pega a hora do evento
                            const date = new Date(event.scheduledStartTimestamp);
                            const hours = date.toLocaleString("pt-BR", {
                                timeZone: "America/Sao_Paulo",
                                hour: "2-digit",
                                minute: "2-digit"
                            });

                            // Envia o aviso no canal de avisos
                            target.send(`Boa noite, turma!!  ${classRole}\n` +
                                "\n" +
                                `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀 \n` +
                                `acesse o card do evento [aqui](${event.url})`)

                            // Adiciona o evento na lista de eventos agendados para evitar duplicidade
                            eventsSchedule.push(event.id)
                        }
                    }
                }

        } catch (err) {
            console.error(`Erro ao buscar eventos da guild ${id} o evento pode não ter um canal de voz vinculado\n${err}`);
        } finally {
            // agenda de novo só depois que terminar tudo
            setTimeout(checkEvents, Number(process.env.EVENT_CHECK_TIME) * 60 * 1000);
        }
    }
}



// Fecha o banco na saída do processo
process.on('SIGINT', () => {
    localDataBase.endConnection() //.then(() => console.info('Conexão com o SQLite fechada'));
    //remoteDataBase.endConnection()// .then(() => console.info('Conexão com o MySQL fechada'))
    process.exit(0);
})



// Define o que o bot deve fazer ao ser iniciado, no caso, imprime uma mensagem de online e cria os comandos existentes
client.once(Events.ClientReady, async c => {
    console.info(`LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);

    // Começa o cadastro de comandos nos servidores
    async function loadCommand(commandName, command) {
        let serverIds = await client.guilds.fetch()
        serverIds = [...serverIds.keys()]

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

        case "invite":
            try {
                const channel = interaction.options.getChannel('channel');
                const role = interaction.options.getRole('role');

                // Cria o convite
                const invite = await channel.createInvite({
                    maxAge: 0,
                    maxUses: 0,
                    duration: 0,
                    unique: true
                });

                // Insere o convite no banco de dados e no cache
                cachedInvites[invite.code] = [role.id, interaction.guild.id];
                await localDataBase.saveInvite(invite.code, role.id, interaction.guild.id);

                // Responde com o link do convite
                await interaction.reply({
                    content: `✅ Convite criado com sucesso!\n📨 Link: ${invite.url}\n📍 Canal: ${channel}\n👥 Cargo vinculado: ${role}`,
                    flags: MessageFlags.Ephemeral // Faz a resposta ser visível apenas para quem executou o comando
                }).then(_ => console.info(`LOG - ${interaction.commandName} ultilizado por ${interaction.user.username} em ${interaction.guild.name}`));
            } catch (error) {
                console.error(`Erro ao criar convite:`, error);
                await interaction.reply({
                    content: `❌ Ocorreu um erro ao criar o convite. Verifique se tenho permissões suficientes.\n` + "```" + error + "```",
                    flags: MessageFlags.Ephemeral
                });
            }
            break;

        case "echo":
            let message = interaction.options.getString("message")
            const echoChannel = interaction.options.getChannel("channel", true);

            if (echoChannel.isTextBased()) {
                await interaction.reply({
                    content: "❌ O canal especificado não é um canal de texto.",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await echoChannel.send(message).then(_ => {
                interaction.reply({
                    content: `✅ Mensagem enviada para ${echoChannel} com sucesso!`,
                    flags: MessageFlags.Ephemeral
                });
                console.info(`LOG - echo ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
            });
            break;

        case "display":
            try {
                const rows = await localDataBase.getAllInvites();

                // Verifica se há convites do banco de dados
                if (!rows) {
                    await interaction.reply({
                        content: "Nenhum convite ativo encontrado.",
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                // implementar uma forma de atualizar os convites do banco de dados quando o convite não existir mais

                // Formata a resposta com os convites
                let response = "Convites ativos:\n";
                rows.forEach(invite => {
                    response += `**${interaction.guild.roles.cache.get(invite.role)} -->** https://discord.gg/${invite.invite}\n`;
                });
                await interaction.reply({
                    content: response,
                    flags: MessageFlags.Ephemeral
                });

            } catch (error) {
                console.error(`ERRO - Falha ao buscar convites:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao buscar os convites.\n"  + "```" + error + "```",
                    flags: MessageFlags.Ephemeral
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

                await interaction.reply({content: "✅ Enquete criada com sucesso!", flags: MessageFlags.Ephemeral});

            } catch (error) {
                console.error(`ERRO - Falha ao criar enquete:`, error);
                await interaction.reply({
                    content: "❌ Ocorreu um erro ao criar a enquete.\n" + error,
                    flags: MessageFlags.Ephemeral
                });
            }
            break;

        case "createclass":
            // Responde de forma atrasada para evitar timeout
            await interaction.deferReply({flags: MessageFlags.Ephemeral});

            // Nome/Sigla da nova turma
            const className = interaction.options.getString('name');

            // Função que cria um convite e registra no banco de dados
            async function createInvite(targetRole, targetChannel) {
                // Cria o convite
                const invite = await targetChannel.createInvite({
                    maxAge: 0, // Convite permanente
                    maxUses: 0, // Convite ilimitado
                    unique: true
                });

                // Insere o convite no banco de dados
                await localDataBase.saveInvite(invite.code, targetRole.id, interaction.guild.id);

                return invite.url;
            }

            try {
                const classRole = await interaction.guild.roles.create({
                    name: `Estudantes ${className}`,
                    color: 3447003,
                    mentionable: true, // Permite que o cargo seja mencionado
                    hoist: true, // Exibe o cargo na lista de membros
                    permissions: classRolePermissions
                });

                // Pega todos os canais do servidor
                const serverChannels = await interaction.guild.channels.fetch()

                // Atribui as permissões do novo cargo aos canais
                for (const channel of serverChannels.values()) {
                    // Ignora canais não especificados no arquivo de configuração "classPatterns"
                    if ([...somePermissionsChannels, interaction.options.getChannel('faq-channel').name].includes(channel.name)) {
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

                // Pega os cargos do servidor
                const roles = await interaction.guild.roles.fetch();

                // Pega os canais do servidor e filtra o nome
                let inviteChannel = await interaction.guild.channels.fetch();
                inviteChannel = inviteChannel.find(channel => channel.name === "✨│boas-vindas")

                // Muda o nome "className" para o nome da turma
                const new_RolesForNewClasses = defaultRoles.rolesForNewClasses.map(obj => {
                    const role = obj.name === "className"
                            ? roles.find(r => r.name === `Estudantes ${className}`)
                            : roles.find(r => r.name === obj.name);

                        return {
                            id: role.id,
                            allow: obj.allow,
                            deny: obj.deny //.map(p => PermissionFlagsBits[p.toUpperCase()]) // convertendo permissões
                        };
                });

                // Cria a categoria da turma
                const classCategory = await interaction.guild.channels.create({
                    name: className,
                    type: 4, // Categoria
                    permissionOverwrites: new_RolesForNewClasses,
                });

                // Cria os canais da turma
                for (const channel of classChannels) {
                    // Cria e define um alvo para preencher as permissões
                    const target = await interaction.guild.channels.create({
                        name: channel.name,
                        type: channel.type,
                        position: channel.position,
                        parent: classCategory.id // Define a categoria da turma
                    })

                    // Verificação para o canal de dúvidas para fazer as ativações
                    if (channel.name === "❓│dúvidas") {
                        await target.setAvailableTags(defaultTags);
                        await Promise.all(classActivations.map(async (activate) => {
                            const content = activate.content.includes("{mention}")
                                ? activate.content.replace("{mention}", `${classRole}`)
                                : activate.content;

                            await target.threads.create({
                                name: activate.title,
                                message: { content }
                            });
                        }));

                    } else if ([classChannels[1].name, classChannels[4].name].includes(channel.name)) {
                        // Define quais canais os membros não podem enviar mensagens
                        await target.permissionOverwrites.edit(classRole, {
                            SendMessages: false,
                            ViewChannel: true
                        })
                    } else if ([classChannels[6].name, classChannels[7].name].includes(channel.name)) {
                        // Define os canais que devem conter o nome/sigla da turma
                        await target.edit({name: channel.name+className})
                    }
                }

                // Cria o convite
                let inviteUrl;
                try {
                    inviteUrl = await createInvite(classRole, inviteChannel);
                } catch (error) {
                    console.error("ERRO - Não foi possível criar o convite\n", error);
                    inviteUrl = "Erro no momento de criação do invite";
                }


                // Responde com o link do invite e outras informações
                await interaction.editReply({
                    content: `✅ Turma ${className} criado com sucesso!\n👥 Cargo vinculado: ${classRole}\nLink do convite: ${inviteUrl}\n`, // `✅ Turma ${className} criado com sucesso!\n📨 Link do convite: ${inviteUrl}\n👥 Cargo vinculado: ${classRole}`
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
            break;

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
                    return !(content.includes('\\-\\-boundary') ||
                        content.includes('Content-Disposition') ||
                        content.startsWith('poll:') ||
                        /^<t:\d+(:[a-zA-Z])?>$/.test(content));

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


/*
// Evento que é disparado quando uma enquete termina
client.on('raw', async (packet) => {
    if (!packet.t || !['GUILD_MEMBER_ADD'].includes(packet.t)) return; // if (!packet.t || !['MESSAGE_UPDATE', 'GUILD_MEMBER_ADD'].includes(packet.t)) return;
    switch (packet.t) {
        case 'GUILD_MEMBER_ADD':
            console.debug(`DEBUG - ${JSON.stringify(packet, null, 2)}`);
            break;
        case 'MESSAGE_UPDATE':
            /*
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
            break;
    }
});
*/


// Evento que é disparado quando um novo membro entra no servidor
client.on(Events.GuildMemberAdd, async member => {
    await globalQueue.enqueue({processData: async (invite, options) => {
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

            /*
                Feature esperando a API do discord resolver se implementarão a funcionalidade de obter o invite diretamente pela interação

            // Tenta resolver o invite diretamente
            let used_invite;
            await member.user.client.fetchInvite(invite)
            const resolvedInvite = member.guild.invites.resolve(member.user.client);
            console.debug(`DEBUG - Invite resolvido para ${member.user.username}:`, resolvedInvite);
            used_invite = resolvedInvite.code;

            if (!used_invite) {
                console.error(`ERRO - Não foi possível obter o código do invite usado por ${member.user.username}`);
                return; // encerra o processamento desse membro sem lançar erro
            }

            // Registra o log de entrada do membro
            console.info(`LOG - ${member.user.username} entrou no servidor ${member.guild.name} com o código: ${used_invite}`);

            // Busca o cargo vinculado ao invite no cache
            if (used_invite in cachedInvites) {
                const role = cachedInvites[used_invite][0]; // Posição do id do cargo
                const roleName = member.guild.roles.cache.get(role).name;

                // Adiciona o cargo ao membro
                await member.roles.add(roleName);
                console.info(`LOG - ${member.user.username} adicionado ao cargo ${roleName}`);
            } else {
                console.error(`ERRO - O invite usado por ${member.user.username} não foi encontrado`);
            }

            /*
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
             */

            // Busca o canal de boas-vindas e envia a mensagem
            const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === "✨│boas-vindas");
            if (welcomeChannel) {
                await welcomeChannel.send(`Olá ${member}, seja bem-vindo(a) a comunidade!`);
                await sendWelcome(member, welcomeChannel).catch(err => {
                    console.error(`ERRO - Não foi possível construir a imagem de boas-vindas para o usuário ${member.user.username}\n${err}`);
                });
            }

        } catch (error) {
            console.error(`ERRO - Não foi possível processar novo membro\n`, error);
        }
    }});
});



try {
    await client.login(process.env.TOKEN);
} catch (error) {
    console.error(`ERRO - Bot não iniciado\n${error}`);
}