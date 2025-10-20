// Importa as dependencias
import dotenv from 'dotenv'
import {
    AttachmentBuilder,
    ChannelType,
    Client,
    Events,
    GatewayIntentBits,
    MessageFlags,
    PollLayoutType
} from "discord.js"
import {
    allPermissionsChannels,
    classActivations,
    classChannels,
    classRolePermissions,
    somePermissionsChannels
} from "./functions/classPatterns.mjs"
import {slashCommands} from "./functions/slashCommands.mjs"
import {defaultRoles} from "./functions/defaultRoles.mjs"
import {defaultTags} from "./functions/defaultTags.mjs";
import {createCanvas, GlobalFonts, loadImage} from '@napi-rs/canvas'
import {request} from 'undici'
import {DataBaseConnect} from "./functions/database.mjs"
import express from 'express';
import bodyParser from 'body-parser';
import {serverNames} from "./functions/servers.mjs";
import fetch from 'node-fetch';
import {defaultEventDescription} from "./functions/defaultEventDescription.js";

dotenv.config();

// Inicia o webhook para receber as informações de cadastro de aulas
const webhook = express();
const port = process.env.PRIMARY_WEBHOOK_PORT || 9999;
webhook.use(bodyParser.json());

// Registra a fonte usada na imagem de boas-vindas
GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont")

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
    ],
    rest: {
        timeout: 10000,
        retries: 1
    }
});



// Conecta aos bancos de dados
const db = await new DataBaseConnect();



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
            this.running--;
            console.error("Erro na fila:", err);
            task._reject(err);
        } finally {
            this.running--;
            this.process();
        }
    }
}

const globalQueue = new Queue(Number(process.env.MAX_CONCURRENT)); // ajusta concorrência definida no .env (1 é recomendado, se velocidade se tornar mais necessária pode-se aumentar esse valor)


// Funções rotineiras

// Lista de todos os eventos que já foram avisados (para evitar duplicidade)
let eventsSchedule = new Map(); // O(1)

// Checagem de eventos dos servidores
async function checkEvents() {
    const start = Date.now();
    console.debug(`DEBUG - ${eventsSchedule.size} eventos avisados`);

    // Pega todos os servidores em que o bot está
    const guilds = await client.guilds.fetch();

    // Cria um array de promises (uma por guild)
    const guildPromises = Array.from(guilds.values()).map(async (partialGuild) => {
        const gStart = Date.now();
        try {
            const guild = await partialGuild.fetch();
            console.time(`Guild ${guild.name} - fetch total`);

            // Busca dados da guild em paralelo
            const [events, channels, roles] = await Promise.all([
                guild.scheduledEvents.fetch(),
                guild.channels.fetch(),
                guild.roles.fetch()
            ]);

            console.timeEnd(`Guild ${guild.name} - fetch total`);

            const now = Date.now();

            // Processa eventos da guild em paralelo
            const eventPromises = Array.from(events.values()).map(async (event) => {
                const diffMinutes = Math.floor((event.scheduledStartTimestamp - now) / 1000 / 60);

                if (
                    diffMinutes > 0 &&
                    diffMinutes <= Number(process.env.EVENT_DIFF_FOR_WARNING) &&
                    !eventsSchedule.has(event.id)
                ) {
                    console.time(`Evento ${event.name} - aviso`);

                    try {
                        // Encontra canal do evento
                        const eventChannel = event.channelId ? channels.get(event.channelId) : null;

                        // Encontra canal de avisos
                        const avisoChannel = eventChannel
                            ? channels.find(c => c.parentId === eventChannel.parentId && c.name === classChannels[1].name)
                            : channels.find(c => c.type === 0 && c.name === classChannels[1].name);

                        if (!avisoChannel) {
                            console.warn(`Canal de aviso não encontrado para evento ${event.name}`);
                            return;
                        }

                        // Determina cargo da turma
                        const overwrites = eventChannel
                            ? eventChannel.permissionOverwrites.cache.filter(o => o.type === 0)
                            : avisoChannel.permissionOverwrites.cache.filter(o => o.type === 0);

                        const parentName = eventChannel?.parent?.name ?? avisoChannel.parent?.name ?? null;
                        if (!parentName) {
                            console.warn(`Evento ${event.name}: sem categoria associada`);
                            return;
                        }

                        const classRole = overwrites
                            .map(o => roles.get(o.id))
                            .find(r => r && r.name.includes("Estudantes " + parentName));

                        // Pega hora formatada
                        const date = new Date(event.scheduledStartTimestamp);
                        const hours = date.toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                            hour: "2-digit",
                            minute: "2-digit"
                        });

                        // Envia aviso
                        await avisoChannel.send(
                            `Boa noite, turma!! ${classRole.toString()}\n\n` +
                            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
                            `acesse o card do evento [aqui](${event.url})`
                        );

                        // Marca evento como avisado
                        eventsSchedule.set(event.id, true);
                        if (eventsSchedule.size === Number(process.env.MAX_EVENTS_CACHE)) {
                            const firstKey = eventsSchedule.keys().next().value;
                            eventsSchedule.delete(firstKey);
                        }

                        console.timeEnd(`Evento ${event.name} - aviso`);
                    } catch (err) {
                        console.error(`Erro ao enviar aviso para evento ${event.name}:`, err);
                    }
                }
            });

            // Aguarda todos os eventos dessa guild terminarem
            await Promise.allSettled(eventPromises);

        } catch (err) {
            console.error(`Erro ao buscar eventos da guild ${partialGuild.id}:`, err);
        } finally {
            console.debug(`Guild ${partialGuild.id} processada em ${Date.now() - gStart}ms`);
        }
    });

    // Aguarda todas as guilds terminarem
    await Promise.allSettled(guildPromises);

    console.debug(`DEBUG - tempo total de execução do checkEvents: ${Date.now() - start}ms`);
}



async function getMembers() {

}

// função para limpar o cache do discord
async function clearCache() {
    await client.guilds.cache.forEach(guild => {
        guild.members.cache.clear();
        guild.channels.cache.clear();
    });
    console.log('LOG - Caches do Discord.js limpos');
}




// Define o que o bot deve fazer ao ser iniciado, no caso, imprime uma mensagem de online e cria os comandos existentes
client.once(Events.ClientReady, async c => {
    console.info(`LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);

    // Cadastra todos os comandos em paralelo
    await client.application.commands.set([]);
    const guilds = await client.guilds.fetch();
    await Promise.all(
        [...guilds.values()].map(async (partialGuild) => {
            const guild = await partialGuild.fetch();
            if (!guild) return;
            await guild.commands.set(slashCommands.map(c => c.commandBuild));
            console.log(`LOG - Comandos registrados em ${guild.name}`);
        })
    );

    // Inicia o processo de checagem de eventos e membros nos servidores
    setInterval(checkEvents, Number(process.env.EVENT_CHECK_TIME) * 60 * 1000);
    //setInterval(getMembers, 22 * 60 * 60 * 1000);
    //setInterval(clearCache, 60 * 60 * 1000); // 1 hora
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
                await db.saveInvite(invite.code, role.id, interaction.guild.id);

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
            let message = interaction.options.getString("message", true);
            const echoChannel = interaction.options.getString("channel", true);
            const attachment = interaction.options.getAttachment("attachment") || null;
            const attachment2 = interaction.options.getAttachment("attachment2") || null;

            const files = [];
            if (attachment) files.push(attachment.url);
            if (attachment2) files.push(attachment2.url);

            const servers = await client.guilds.fetch();
            for (const [id, partialGuild] of servers) {
                const guild = await partialGuild.fetch();
                const channels = await guild.channels.fetch();
                for (let [id, channel] of channels) {
                    if (channel.name === echoChannel){
                        await channel.send({
                            content: message.replace(/\\n/g, '\n'),
                            files: files
                        });
                    }
                }
            }

            await interaction.reply({
                content: `✅ Mensagem enviada para ${echoChannel} com sucesso!`,
                flags: MessageFlags.Ephemeral
            });
            console.info(`LOG - echo ultilizado por ${interaction.user.username} em ${interaction.guild.name}`);
            break;

        case "display":
            try {
                const rows = await db.getAllInvites();

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
                await db.saveInvite(invite.code, targetRole.id, interaction.guild.id);

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

            // limpa o cache e as mensagens para economizar memória
            channel.messages.cache.clear();
            allMessages = null;

            break;

        case "event":
            const topic = interaction.options.getString('topic');
            const date = interaction.options.getString('date');
            const time = interaction.options.getString('time');
            const description = interaction.options.getString('description');
            const link = interaction.options.getString('link');
            const background = interaction.options.getAttachment('background');

            if (!background.contentType.startsWith('image/')) {
                return await interaction.reply({
                    content: '❌ O arquivo enviado não é uma imagem válida.',
                    ephemeral: true
                });
            }

            const response = await fetch(background.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await interaction.guild.scheduledEvents.create({
                name: topic,
                scheduledStartTime: new Date(`${date}T${time}:00-03:00`),
                scheduledEndTime: new Date(new Date(`${date}T${time}:00-03:00`).getTime() + 180 * 60 * 1000), // Duração padrão de 3 horas
                privacyLevel: 2, // Guild Only
                entityType: 3, // External
                description: description.replace(/\\n/g, '\n'),
                image: `data:image/png;base64,${buffer.toString('base64')}`,
                entityMetadata: {location: link}
            })

            await interaction.reply({ content: "✅ Evento criado com sucesso!", flags: MessageFlags.Ephemeral });
            break;

        default:
            break;
    }
});


// Evento que é disparado quando uma enquete termina
client.on('raw', async (packet) => {
    if (!packet.t || !['MESSAGE_UPDATE'].includes(packet.t)) return;
    switch (packet.t) {
        case 'MESSAGE_UPDATE':
            if (packet.d.poll?.results?.is_finalized) {
                const pollData = packet.d;
                globalQueue.enqueue({
                    processData: async () => {
                        const d1 = new Date(pollData.poll.expiry.slice(0, 23)); // momento em que a enquete terminou
                        const d2 = new Date(pollData.timestamp.slice(0, 23)); // momento em que a mensagem foi atual
                        let body = {
                            question: pollData.poll.question.text, // a pergunta da enquete
                            answers: pollData.poll.answers.map(answer => [{ // lista de respostas
                                response: answer.poll_media.text,
                                answers: pollData.poll.results.answer_counts.map(count => count.count)[answer.answer_id - 1]
                            }]),
                            duration: `${((d1 - d2) / 1000 / 60 / 60).toFixed(0)}` // horas
                        };

                        const response = await fetch(process.env.N8N_ENDPOINT + '/salvarEnquete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'token': process.env.N8N_TOKEN
                            },
                            body: JSON.stringify(body)
                        })

                        /*try {


                            console.log(JSON.stringify(poll_json, null, 4));

                            //await db.savePoll(pollData.id, poll_json);

                        } catch (err) {
                            console.error("Erro ao processar poll:", err);
                        }*/
                    }
                });
            }
            break;
        default:
            break;
    }
});


/*
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
*/

// Endpoint para cadastros de eventos no servidores (não há tratamento de erros aqui, pois os dados já chegam no formato correto)
webhook.post('/criarEvento', async (req, res) => {
    console.debug('DEBUG - Dados recebidos: ', req.body);
    const {turma, nomeEvento, tipo, data_hora, link} = req.body;
    try {
        // Pega todos os servidores em que o bot está
        const guild = await client.guilds.fetch(serverNames[turma.replace(/\d+/g, '')]);

        if (!guild) {
            console.error(`Servidor de ${turma.replace(/\d+/g, '')} não encontrado`);
            res.status(500).json({status: 'erro', mensagem: `Servidor de ${turma.replace(/\d+/g, '')} não encontrado`});
        }

        // Faz fetch dos canais do servidor e busca pelo canal de voz da turma
        const channels = await guild.channels.fetch();
        const voiceChannel = channels.find(c => c.name === classChannels[7].name + turma && c.type === 2);

        let description = defaultEventDescription[tipo] instanceof Function;
        description = description ? defaultEventDescription[tipo](link) : defaultEventDescription[tipo];

        // Marca o evento no servidor
        const scheduledEvent = await guild.scheduledEvents.create({
            name: `${turma} - ${nomeEvento}`,
            scheduledStartTime: new Date(`${data_hora}`),
            scheduledEndTime: new Date(new Date(`${data_hora}`).getTime() + 180 * 60 * 1000),
            privacyLevel: 2,
            entityType: 2,
            channel: voiceChannel.id,
            description: description,
            image: './assets/postech.png'
        });

        // Responde o request com sucesso e registra o log
        console.log(`LOG - Evento ${nomeEvento} criado com sucesso`);
        res.json({status: 'sucesso', evento: scheduledEvent});
    } catch (error) {
        console.error(`Servidor de ${turma.replace(/\d+/g, '')} não encontrado ou a turma não corresponde ao cargo\n`, error);
        res.status(500).json({status: 'erro', mensagem: `${error}`});
    }
});


webhook.listen(port, "0.0.0.0", () => {
    console.log(`Webhook aberto em: ${port}`);
});



process.on('SIGINT', async () => {
    console.log('LOG - Recebido SIGINT - desligando graciosamente...');

    // Limpa timers e listeners
    client.removeAllListeners();

    // Fecha conexão com banco de dados
    if (db && db.close) {
        await db.close();
    }

    // Destrói o cliente Discord
    await client.destroy();

    console.log('LOG - Desligamento completo');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('LOG - Recebido SIGTERM - desligando graciosamente...');

    client.removeAllListeners();

    if (db && db.close) {
        await db.close();
    }

    client.destroy();

    console.log('LOG - Desligamento completo');
    process.exit(0);
});

try {
    await client.login(process.env.TOKEN);
} catch (error) {
    console.error(`ERRO - Bot não iniciado\n${error}`);
}
