import {classChannels} from "../utils/classPatterns.js";

/**
 * Responsável por formatar e enviar a notificação do evento.
 */
class NotificationService {
    constructor(guild) {
        this.guild = guild;
    }

    _formatMessage(event, classRole) {
        const date = new Date(event.scheduledStartTimestamp);
        const hours = date.toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit"
        });

        return `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
               `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
               `acesse o card do evento [aqui](${event.url})`;
    }

    async _findClassRole(channel) {
        const parentName = channel.parent?.name;
        if (!parentName) return null;

        const overwrites = channel.permissionOverwrites.cache.filter(o => o.type === 0);
        const rolesPromises = overwrites.map(async o => {
            const role = await this.guild.roles.fetch(o.id).catch(() => null);
            return role?.name?.includes("Estudantes " + parentName) ? role : null;
        });

        const roles = await Promise.all(rolesPromises);
        return roles.find(r => r !== null) || null;
    }

    async sendReminder(event, targetChannel) {
        if (!targetChannel?.isTextBased()) return;

        // Para encontrar o cargo, usamos o canal de voz do evento se existir, ou o próprio canal de avisos.
        const referenceChannel = event.channel || targetChannel;
        const classRole = await this._findClassRole(referenceChannel);
        const message = this._formatMessage(event, classRole);

        await targetChannel.send(message);
    }
}

export class functionsWithIntervals{
    constructor(client, db, flags){
        this.client = client
        this.db = db
        this.flags = flags
        this.events = new Map();
        this.eventDiffMinutes = Number(process.env.EVENT_DIFF_FOR_WARNING);
        this.maxCacheSize = Number(process.env.MAX_EVENTS_CACHE);
    }

    async checkEvents(){
        //const start = Date.now();
        //console.debug(`DEBUG - ${eventsSchedule.size} eventos avisados`);

        const guilds = await this.client.guilds.cache;
        const now = Date.now();

        // Processa todos os servidores em paralelo
        await Promise.allSettled(
            Array.from(guilds.values()).map(async partialGuild => {
                try {
                    if (!this.flags[partialGuild.id]["checkEvents"]) {
                        console.log(`LOG - Avisos de ${partialGuild.name} ignorados`);
                        return
                    }

                    const notificationService = new NotificationService(partialGuild);

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
                                diffMinutes <= this.eventDiffMinutes &&
                                !this.events.has(event.id)
                            ) {
                                // Caso 1: Evento sem canal específico (ex: evento geral do servidor)
                                if (!event.channelId) {
                                    const avisoChannels = channels.filter(
                                        c => c.type === 0 && c.name === classChannels[1].name
                                    );

                                    await Promise.allSettled(
                                        avisoChannels.map(channel => notificationService.sendReminder(event, channel))
                                    );
                                } else {
                                    // Caso 2: Evento com canal de voz definido
                                    const eventChannel = channels.get(event.channelId);
                                    if (!eventChannel) return;

                                    const targetChannel = channels.find(
                                        c => c.parentId === eventChannel.parentId &&
                                            c.name === classChannels[1].name
                                    );
                                    if (!targetChannel) return;

                                    await notificationService.sendReminder(event, targetChannel);
                                }

                                // Gerencia o cache após o envio
                                this.events.set(event.id, true);
                                if (this.events.size > this.maxCacheSize) {
                                    const firstKey = this.events.keys().next().value;
                                    this.events.delete(firstKey);
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

        //const end = Date.now();
        //console.debug(`DEBUG - tempo de execução do checkEvents: ${end - start}ms`);
    }
}