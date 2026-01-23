import Bot from "../../bot.js";
import {Guild, GuildScheduledEvent, GuildScheduledEventStatus, VoiceBasedChannel} from "discord.js";
import logger from "../../utils/logger.ts";

interface EventData {
    guildName: string;
    maxParticipants: number;
    startedAt: StartTimestamp | null;
    endedAt: EndTimestamp | null;
    class: string;
}

type StartTimestamp = number
type EndTimestamp = number

export default class StudyGroupAnalysis {
    private readonly bot: Bot
    name: string
    public readonly possibleNames: string[]
    private events: Map<string, EventData>
    constructor(bot: Bot) {
        this.events = new Map()
        this.bot = bot
        this.name = import.meta.url.split('/').pop()!.replace('.js', '')
        this.possibleNames = [
            "estudo", "estudos", "Grupo", "Sala de", "Sala de estudo", "Sala de estudos",
            "Grupo de estudo", "Grupo de estudos", "Estudos", "Estudo", "grupo"
        ]
    }

    private async processEvent(event: GuildScheduledEvent) {
        // Verifica se o evento que está a ser observado é um evento de "Grupo de estudos"
        if (!this.possibleNames.includes(event.name.split(" - ")[1]!) && !event.channelId && !this.events.has(event.channelId!)) return

        // Ignora o evento se ele não tiver iniciado
        if (![GuildScheduledEventStatus.Active, GuildScheduledEventStatus.Completed].includes(event.status)) return

        // Ignora o evento se ele não tiver um canal de voz vinculado
        const channel = await this.bot.client.channels.fetch(event.channelId!) as VoiceBasedChannel;
        if (!channel) return;

        // Adiciona o evento a lista caso ainda não exista
        if (!this.events.has(event.id)) {
            this.events.set(event.id, {
                guildName: event.guild?.name || "Desconhecido",
                maxParticipants: 0,
                startedAt: null,
                endedAt: null,
                class: event.channel!.parent!.name
            });
        }

        // Obtém os dados do evento
        const eventData = this.events.get(event.id)!;

        // Força o fetch do canal para garantir dados atualizados
        await channel.fetch();

        // Verifica a presença de um membro com o cargo de professor
        const hasProfessor = channel.members.some(member =>
            member.roles.cache.some(role => role.name === "Professores")
        );

        // Só define que o evento começou agora se houver professor e ainda não tiver sido definido
        if (hasProfessor && !eventData.startedAt) {
            eventData.startedAt = Date.now();
        }

        // Atualiza apenas se o número atual for maior que o registrado
        const currentParticipants = channel.members.size;

        if (currentParticipants > eventData.maxParticipants) {
            eventData.maxParticipants = currentParticipants;
        }

        // 1. O horário atual passou do horário agendado de fim?
        const now = Date.now();
        const isOverdue = event.scheduledEndTimestamp ? now > event.scheduledEndTimestamp : false;

        // 2. Não há mais professor na sala (e o evento já tinha começado/professor já tinha entrado antes)?
        if (isOverdue || !hasProfessor) {
            eventData.endedAt = Date.now();

            // Envia para o endpoint e limpa do cache local
            await this.sendData(event.id, eventData);
            this.events.delete(event.id);
            await channel.guild.scheduledEvents.delete(event.id);
        }

        logger.debug(JSON.stringify(this.events))
    }

    private async sendData(eventId: string, eventData: EventData) {
        const res = await fetch(`${process.env.N8N_ENDPOINT}/salvarDadosGrupoEstudo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': process.env.N8N_TOKEN as string
            },
            body: JSON.stringify({ guildName: eventData.guildName, eventId, maxParticipants: eventData.maxParticipants, startedAt: eventData.startedAt, endedAt: eventData.endedAt })
        })

        if (!res.ok) {
            throw new Error(`Erro ao enviar dados para o n8n: ${res.status} - ${res.statusText} - ${res.url}`)
        }
    }

    private async processGuild(guild: Guild) {
        for (const event of guild.scheduledEvents.cache.values()) {
            await this.processEvent(event)
        }
    }

    public async execute(event: GuildScheduledEvent | null = null) {
        if (event) {
            await this.processEvent(event)
        } else {
            for (const guild of this.bot.client.guilds.cache.values()) {
                await this.processGuild(guild)
            }
        }
    }
}
