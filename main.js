// Importa as dependencias
import dotenv from 'dotenv'
import {
    AttachmentBuilder,
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
import {GlobalFonts} from '@napi-rs/canvas'
import {DataBase} from "./functions/database.mjs"
import express from 'express';
import bodyParser from 'body-parser';
import {serverNames} from "./functions/servers.mjs";
import fetch from 'node-fetch';
import {defaultEventDescription} from "./functions/defaultEventDescription.js";
import crypto from "crypto";

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



// Conecta ao bancos de dados e verifica a existência das tabelas
const db = await new DataBase();
await db.connect();
await db.verify();



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
let eventsSchedule = new Map();

// Comando que é executado a cada determinado espaço de tempo
async function checkEvents() {
    const start = Date.now();
    //console.debug(`DEBUG - ${eventsSchedule.size} eventos avisados`);

    const guilds = await client.guilds.fetch();
    const now = Date.now();

    // Processa todos os servidores em paralelo
    await Promise.allSettled(
        Array.from(guilds.values()).map(async partialGuild => {
            try {
                const guild = await partialGuild.fetch();
                const [events, channels] = await Promise.all([
                    guild.scheduledEvents.fetch(),
                    guild.channels.fetch()
                ]);

                // Processa todos os eventos do servidor em paralelo
                await Promise.allSettled(
                    Array.from(events.values()).map(async event => {
                        const diffMinutes = Math.floor((event.scheduledStartTimestamp - now) / 1000 / 60);

                        if (
                            diffMinutes > 0 &&
                            diffMinutes <= Number(process.env.EVENT_DIFF_FOR_WARNING) &&
                            !eventsSchedule.has(event.id)
                        ) {
                            // sem canal (manda aviso em todos canais de aviso)
                            if (!event.channelId) {
                                const avisoChannels = channels.filter(
                                    c => c.type === 0 && c.name === classChannels[1].name
                                );

                                await Promise.allSettled(
                                    avisoChannels.map(async channel => {
                                        if (!channel.isTextBased()) return;

                                        const parentName = channel.parent?.name;
                                        if (!parentName) return;

                                        const overwrites = channel.permissionOverwrites.cache.filter(o => o.type === 0);
                                        const roles = await Promise.all(
                                            overwrites.map(async o => {
                                                const role = await guild.roles.fetch(o.id).catch(() => null);
                                                return role?.name?.includes("Estudantes " + parentName) ? role : null;
                                            })
                                        );

                                        const classRole = roles.find(r => r !== null);
                                        const date = new Date(event.scheduledStartTimestamp);
                                        const hours = date.toLocaleString("pt-BR", {
                                            timeZone: "America/Sao_Paulo",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        });

                                        await channel.send(
                                            `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
                                            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
                                            `acesse o card do evento [aqui](${event.url})`
                                        );

                                        eventsSchedule.set(event.id, true);
                                        if (eventsSchedule.size === Number(process.env.MAX_EVENTS_CACHE)) {
                                            const firstKey = eventsSchedule.keys().next().value;
                                            eventsSchedule.delete(firstKey);
                                        }
                                    })
                                );
                            } else {
                                // evento com canal definido
                                const eventChannel = channels.get(event.channelId);
                                if (!eventChannel) return;

                                const target = channels.find(
                                    c => c.parentId === eventChannel.parentId &&
                                        c.name === classChannels[1].name
                                );
                                if (!target) return;

                                const overwrites = eventChannel.permissionOverwrites.cache.filter(o => o.type === 0);
                                let classRole = await Promise.all(
                                    overwrites.map(async o => {
                                        const role = await guild.roles.fetch(o.id).catch(() => null);
                                        return role?.name?.includes("Estudantes " + eventChannel.parent.name)
                                            ? role
                                            : null;
                                    })
                                );

                                classRole = classRole.filter(r => r)[0];
                                const date = new Date(event.scheduledStartTimestamp);
                                const hours = date.toLocaleString("pt-BR", {
                                    timeZone: "America/Sao_Paulo",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                });

                                await target.send(
                                    `Boa noite, turma!! ${classRole ?? ""}\n\n` +
                                    `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
                                    `acesse o card do evento [aqui](${event.url})`
                                );

                                eventsSchedule.set(event.id, true);
                                if (eventsSchedule.size === Number(process.env.MAX_EVENTS_CACHE)) {
                                    const firstKey = eventsSchedule.keys().next().value;
                                    eventsSchedule.delete(firstKey);
                                }
                            }
                        }
                    })
                );
            } catch (err) {
                console.error(
                    `Erro ao buscar eventos da guild ${partialGuild.id}: ${err}`
                );
            }
        })
    );

    const end = Date.now();
    console.debug(`DEBUG - tempo de execução do checkEvents: ${end - start}ms`);
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
    setInterval(checkEvents, Number(process.env.EVENT_CHECK_TIME) * 60 * 1000); // minutos
    setInterval(clearCache, 60 * 60 * 1000); // 1 hora
});

// Define o que o bot deve fazer ao ser adicionado num servidor novo
client.on(Events.GuildCreate, async guild => {
    console.info(`LOG - ${client.user.username} adicionado ao servidor ${guild.name} com ID ${guild.id}`);

    await guild.commands.set(slashCommands.map(c => c.commandBuild));
    console.log(`LOG - Comandos registrados em ${guild.name}`);
})

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
            // Responde de forma atrasada para evitar timeout
            await interaction.deferReply({flags: MessageFlags.Ephemeral});

            // Coleta os dados do comando
            let message = interaction.options.getString("message", true);
            let echoChannel = interaction.options.getChannel("channel", true);
            const attachment = interaction.options.getAttachment("attachment") || null;
            const attachment2 = interaction.options.getAttachment("attachment2") || null;
            const onlyForThisChannel = interaction.options.getInteger("only-for-this-channel") ?? false;

            // Se não for canal único então ele atribui o nome do canal ao echoChannel ao invés do id
            !onlyForThisChannel ? await client.channels.fetch(echoChannel.id).then(channel => {
                echoChannel = channel.name;
            }) : null

            // Obtém a url dos arquivos anexados
            const files = [];
            if (attachment) files.push(attachment.url);
            if (attachment2) files.push(attachment2.url);

            // Se não for canal único então busca em todos os servidores e envia para todos, do contrário envia para o canal especificado
            if (!onlyForThisChannel) {
                const servers = await client.guilds.fetch();

                // Processa todos os servidores em paralelo
                await Promise.allSettled(
                    Array.from(servers.values()).map(async (partialGuild) => {
                        const guild = await partialGuild.fetch();
                        const channels = await guild.channels.fetch();

                        // Processa todos os canais correspondentes em paralelo
                        const matchingChannels = Array.from(channels.values()).filter(
                            channel => channel.name === echoChannel
                        );

                        await Promise.allSettled(
                            matchingChannels.map(channel =>
                                channel.send({
                                    content: message.replace(/\\n/g, '\n'),
                                    files: files
                                })
                            )
                        );
                    })
                );
            } else {
                await echoChannel.send({
                    content: message.replace(/\\n/g, '\n'),
                    files: files
                });
            }

            await interaction.editReply({
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
                return
            }
            break

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

            break

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
            break

        case "disable":
            const role = interaction.options.getRole('role');
            const channels = await interaction.guild.channels.fetch();

            await interaction.deferReply({flags: MessageFlags.Ephemeral});

            for (const [_, channel] of channels) {
                await channel.permissionOverwrites.edit(role.id, {
                    SendMessages: false,
                    ViewChannel: false,
                    ReadMessageHistory: false,
                    AddReactions: false
                });
            }

            await interaction.editReply({flags: MessageFlags.Ephemeral, content: "✅ Cargo desabilitado com sucesso!"});
            break

        default:
            break
    }
});


// Evento que é disparado quando uma enquete termina
client.on('raw', async (packet) => {
    switch (packet.t) {
        case 'MESSAGE_UPDATE':
            if (packet.d.poll?.results?.is_finalized) {
                const pollData = packet.d;
                globalQueue.enqueue({
                    processData: async () => {
                        const d1 = Date.now() + 3 * 60 * 60 * 1000; // 3 horas antes (GMT-3), momento em que a enquete terminou
                        const d2 = new Date(pollData.timestamp.slice(0, 23));

                        // Descobre a turma que a enquete pertence
                        const channel = await client.channels.fetch(pollData.channel_id);
                        const className = channel.parent.name

                        // Descobre o servidor
                        const guild = await client.guilds.fetch(pollData.guild_id);
                        const serverName = guild.name

                        // Prepara o body para ser enviado para o n8n
                        let body = {
                            created_by: pollData.author.global_name,
                            guild: serverName,
                            poll_category: className,
                            poll_hash: crypto.createHash('sha1').update(pollData.poll.question.text).digest('hex'),
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
                    }
                });
            }
            break // Enquetes

        case 'MESSAGE_CREATE': // Mensagens
            try {
                // Filtra a origem das mensagens
                if (![0, 11, 2, 13].includes(packet.d.channel_type)) break

                // Ignora mensagens de bots
                if (packet.d.author.bot) break;

                // Ignora mensagens do sistema (welcome, boost, pin, etc)
                if (packet.d.type !== 0) break;

                // Ignora mensagens vazias (sem conteúdo de texto)
                if (!packet.d.content || packet.d.content.trim() === '') break;

                // Ignora webhooks
                if (packet.d.webhook_id) break;

                // Ignora mensagens com apenas menções
                if (packet.d.content.match(/^<@!?\d+>$/)) break;

                // Ignora comandos (mensagens que começam com /)
                if (packet.d.content.startsWith('/')) break;

                // Ignora mensagens de threads automáticas
                if (packet.d.flags && (packet.d.flags & 32)) break;

                // Adiciona o processamento da mensagem a fila global
                globalQueue.enqueue({
                    processData: async () => {
                        try {
                            // Descobre dados do canal
                            const channel = await client.channels.fetch(packet.d.channel_id);
                            if (!channel) {
                                console.error('Channel not found:', packet.d.channel_id);
                                return;
                            }

                            // Descobre o servidor
                            const guild = await client.guilds.fetch(packet.d.guild_id);
                            const serverName = guild.name;

                            // Descobre o maior cargo do membro pela posição hierárquica
                            const member = await guild.members.fetch(packet.d.author.id);
                            const roles = member.roles.cache.filter(role => role.id !== guild.id);
                            const sortedRoles = roles.sort((a, b) => b.position - a.position);

                            // Verifica se há pelo menos um cargo
                            const topRole = sortedRoles.first();
                            if (!topRole) {
                                console.log("LOG - Cargo do membro não encontrado, ignorando interação");
                                return;
                            }

                            // Descobre o horário da mensagem
                            const localTime = new Date(packet.d.timestamp).toISOString();

                            const body = {
                                createdBy: packet.d.author.global_name || 'Usuário desconhecido',
                                guild: serverName,
                                message: packet.d.content || null,
                                timestamp: localTime,
                                id: packet.d.id,
                                authorRole: topRole.name
                            };

                            if (packet.d.channel_type === 11) {
                                body.thread = channel.name;
                                body.channel = null;

                                if (channel.parent) {
                                    const category = await client.channels.fetch(channel.parent.parent.id);
                                    body.class = category?.name || null;
                                } else {
                                    body.class = null;
                                }
                            } else {
                                body.channel = channel.name;
                                body.thread = null;
                                body.class = channel.parent?.name || null;
                            }

                            const response = await fetch(process.env.N8N_ENDPOINT + '/salvarInteracao', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'token': process.env.N8N_TOKEN
                                },
                                body: JSON.stringify(body)
                            });

                            if (!response.ok) {
                                console.error('ERRO - N8N endpoint não acessível:', response.status, response.statusText);
                            }
                        } catch (error) {
                            console.error('ERRO - Erro ao processar interação', error);
                        }
                    }
                });
            } catch (error) {
                console.log("LOG - Cargo do aluno não encontrado, ignorando interação")
            }
            break; // Interações

        default:
            break;
    }
});


// Endpoint para cadastros de eventos nos servidores (não há tratamento de erros aqui, pois os dados já chegam no formato correto)
webhook.post('/criarEvento', async (req, res) => {
    console.debug('DEBUG - Dados recebidos: ', req.body);
    const {turma, nomeEvento, tipo, data_hora, link, fim} = req.body;

    if (nomeEvento.length > 100) {
        res.status(403).json({status: 'erro', mensagem: "O nome da aula ultrapassa 100 caracteres, busque reduzir a quantidade de caracteres."});
    }

    try {
        // Pega todos os servidores em que o bot está
        const guild = await client.guilds.fetch(serverNames[turma.replace(/\d+/g, '').replace(" ", "")]);

        console.debug(`DEBUG - Servidor ${guild.name}`);

        if (!guild) {
            console.error(`Servidor de ${turma.replace(/\d+/g, '')} não encontrado`);
            res.status(500).json({status: 'erro', mensagem: `Servidor de ${turma.replace(/\d+/g, '')} não encontrado`});
        }

        // Faz fetch dos canais do servidor e busca pelo canal de voz da turma
        const channels = await guild.channels.fetch();
        const voiceChannel = channels.find(c => c.name === classChannels[7].name + turma && c.type === 2);

        console.debug(`DEBUG - Canal ${voiceChannel.name}`);

        let description = defaultEventDescription[tipo] instanceof Function;
        description = description ? defaultEventDescription[tipo](link) : defaultEventDescription[tipo];

        // Marca o evento no servidor
        const scheduledEvent = await guild.scheduledEvents.create({
            name: `${turma} - ${nomeEvento}`,
            scheduledStartTime: new Date(`${data_hora}`),
            scheduledEndTime: new Date(`${fim}`),
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
        console.error(`Servidor de ${turma.replace(/\d+/g, '').replace(" ", "")} não encontrado ou a turma não corresponde ao cargo\n`, error);
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
    await db.endConnection();

    // Destrói o cliente Discord
    await client.destroy();

    console.log('LOG - Desligamento completo');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('LOG - Recebido SIGTERM - desligando graciosamente...');

    // Limpa timers e listeners
    client.removeAllListeners();

    // Fecha conexão com banco de dados
    await db.endConnection();

    // Destrói o cliente Discord
    await client.destroy();

    console.log('LOG - Desligamento completo');
    process.exit(0);
});

try {
    await client.login(process.env.TOKEN);
} catch (error) {
    console.error(`ERRO - Bot não iniciado\n${error}`);
}
