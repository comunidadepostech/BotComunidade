import {Events} from "discord.js";
import crypto from "crypto";
import fetch from "node-fetch";

export class RawEvent {
    constructor(flags){
        this.name = Events.Raw;
        this.once = false;

        this.flags = flags
    }

    async execute(client, packet){
        switch (packet.t) {
            case 'MESSAGE_UPDATE':
                if (!this.flags[packet.d.guild_id]["savePolls"]) break

                if (packet.d.poll?.results?.is_finalized) {
                    const pollData = packet.d;
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

                break // Enquetes

            case 'MESSAGE_CREATE': // Mensagens
                try {
                    if (!this.flags[packet.d.guild_id]["saveInteractions"]) break

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

                } catch (error) {
                    console.log("LOG - Cargo do aluno não encontrado, ignorando interação")
                }
                break; // Interações

            default:
                break;
        }
    }
}