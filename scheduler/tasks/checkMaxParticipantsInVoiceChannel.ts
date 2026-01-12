import Bot from "../../bot.js";
import logger from "../../utils/logger.ts";

interface EventData {
    name: string;
    maxParticipants: number;
}
type
type

/*
{
    "serverID": [
        "id1" {
            "name": "Nome do evento",
            "maxParticipants": numero máximo de participantes
        }
    ]
}
*/

export default class checkMaxParticipantsInVoiceChannel {
    bot: Bot
    private activeEventsWithParticipants: Map<string, EventData>;
    name: string
    endpoint: string

    constructor(bot: Bot){
        this.bot = bot
        this.name = import.meta.url.split('/').pop()!.replace('.js', '')
        this.activeEventsWithParticipants = new Map()
        this.endpoint = '/salvarMaximoDeParticipantes'
    }

    async saveEventMaxParticipants (eventName: string, participants: number): Promise<void> {
        let send = async (eventName: string, participants: number) => {
            return await fetch(process.env.N8N_ENDPOINT + this.endpoint, {
                body: JSON.stringify({eventName: eventName, maxParticipants: participants}),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': process.env.N8N_TOKEN! as string
                }
            })
        }

        try {
            let res = await send(eventName, participants)

            if (!res.ok) {
                logger.error(`Erro ao enviar dados de participantes para o n8n, tentando novamente...`)
                res = await send(eventName, participants)
            }

            if (!res.ok) {
                logger.error(`Erro final ao enviar dados de participantes para o n8n: ${res.status} - ${res.statusText}`);
            }
        } catch (e) {
            logger.error(`Exceção ao enviar dados para o n8n: ${e}`);
        }
    }

    async processGuildEvents(guildID: string, bot: Bot) {
        let completeGuild = await bot.client.guilds.fetch(guildID)
        const currentActiveEventIds = new Set<string>();

        for (let event of completeGuild.scheduledEvents.cache.values()) {
            if (!event.channel) continue

            currentActiveEventIds.add(event.id);
            const currentParticipants = event.channel.members.size;

            if (this.activeEventsWithParticipants.has(event.id)) {
                const storedData = this.activeEventsWithParticipants.get(event.id)!;
                if (currentParticipants > storedData.maxParticipants) {
                    storedData.maxParticipants = currentParticipants;
                    this.activeEventsWithParticipants.set(event.id, storedData);
                }
            } else {
                this.activeEventsWithParticipants.set(event.id, {
                    name: event.name,
                    maxParticipants: currentParticipants
                });
            }
        }

        for (const [eventId, ] of this.activeEventsWithParticipants) {
            const eventStillExists = completeGuild.scheduledEvents.cache.has(eventId);
            const eventInDiscord = completeGuild.scheduledEvents.cache.get(eventId);

            const isFinished = !eventStillExists || (eventInDiscord && (eventInDiscord.status === 3 || eventInDiscord.status === 4));
        }
    }

    async updateAndSaveEvents(guildID: string, bot: Bot) {
        const completeGuild = await bot.client.guilds.fetch(guildID);
        
        // IDs dos eventos ativos NESTA execução para ESSA guilda
        const activeEventIdsInGuild = new Set<string>();

        // Iterar sobre eventos ativos no Discord
        for (const event of completeGuild.scheduledEvents.cache.values()) {
            // Consideramos apenas eventos ativos (Status 2) e com canal de voz
            if (event.status === 2 && event.channel) {
                activeEventIdsInGuild.add(event.id);
                const currentCount = event.channel.members.size;

                const storedEvent = this.activeEventsWithParticipants.get(event.id);
                if (storedEvent) {
                    // Atualiza se maior
                    if (currentCount > storedEvent.maxParticipants) {
                        storedEvent.maxParticipants = currentCount;
                        this.activeEventsWithParticipants.set(event.id, storedEvent);
                    }
                } else {
                    // Novo evento
                    this.activeEventsWithParticipants.set(event.id, {
                        name: event.name,
                        maxParticipants: currentCount
                    });
                }
            }
        }

        for (const [id, data] of this.activeEventsWithParticipants) {
            const discordEvent = completeGuild.scheduledEvents.cache.get(id);

            if (discordEvent) {
                if (discordEvent.status !== 2) {
                    // Encerrou (Completed ou Canceled)
                    await this.saveEventMaxParticipants(data.name, data.maxParticipants);
                    this.activeEventsWithParticipants.delete(id);
                }
            } else {

            }
        }
    }
}
