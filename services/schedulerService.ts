import {
    Client,
    Collection,
    Guild,
    GuildMember,
    GuildScheduledEvent,
    Role,
    TextChannel,
    GuildScheduledEventStatus,
    ChannelType,
    VoiceChannel
} from "discord.js";
import FeatureFlagsService from "./featureFlagsService.ts";
import { WARNING_CHANNEL_NAME } from "../constants/discordContants.ts";

// Criamos uma interface para gerenciar tudo sobre o evento em um único lugar
interface EventState {
    notified: boolean;
    maxParticipants: number;
    reported: boolean;
}

export class SchedulerService {
    // Agora o cache guarda um objeto completo para cada evento
    private eventsCache = new Map<string, EventState>();

    constructor(
        private client: Client,
        private featureFlagsService: FeatureFlagsService,
        private studyGroupPossibleNames = ["Sala de estudo", "Sala de estudos", "Grupo de estudo", "Grupo de estudos", "Grupo de Estudos", "Grupo de Estudo"],
        private maxEventsCacheSize = 3000,
        private ONE_HOUR_AND_HALF_IN_MILLISECONDS = 120 * 60 * 1000,
    ) {}

    private async handleEventCompletion(event: GuildScheduledEvent, peakParticipants: number, className: string): Promise<void> {
        const payload = {
            curso: event.guild!.name,
            turma: className,
            maximoDeParticipantes: peakParticipants
        };

        console.log(`[${event.id}] Enviando dados para o n8n:`, payload);

        try {
            await fetch(process.env.N8N_ENDPOINT + '/salvarDadosGrupoEstudo', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "token": process.env.N8N_WEBHOOKS_TOKEN as string
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error(`Erro ao enviar dados do evento ${event.id} para o n8n:`, error);
        }
    }

    private async sendWarning(classRole: Role | undefined, eventUrl: string, scheduledStartTimestamp: number, channel: TextChannel) {
        const date = new Date(scheduledStartTimestamp);
        const hours = date.toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit"
        });

        await channel.send(
            `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
            `acesse o card do evento [aqui](${eventUrl})`
        );
    }

    private async handleNotification(event: GuildScheduledEvent, className: string) {
        const classRole = event.guild!.roles.cache.find(role => role.name === "Estudantes " + className);

        const warningChannels = event.guild!.channels.cache.filter(
            c => c.type === ChannelType.GuildText && c.name === WARNING_CHANNEL_NAME
        );

        if (event.channelId) {
            const voiceChannel = event.guild!.channels.cache.get(event.channelId);
            const parentId = voiceChannel?.parentId;

            const targetChannel = warningChannels.find(c => c.parentId === parentId) as TextChannel | undefined;
            if (targetChannel) {
                await this.sendWarning(classRole, event.url, event.scheduledStartTimestamp!, targetChannel);
            }
        } else {
            for (const channel of warningChannels.values()) {
                await this.sendWarning(classRole, event.url, event.scheduledStartTimestamp!, channel as TextChannel);
            }
        }
    }

    private manageCacheSize() {
        if (this.eventsCache.size > this.maxEventsCacheSize) {
            const firstKey = this.eventsCache.keys().next().value;
            if (firstKey) this.eventsCache.delete(firstKey);
        }
    }

    private async processEvent(event: GuildScheduledEvent) {
        if (!event.name.includes(" - ")) return;
        const [className, eventName] = event.name.split(" - ");
        if (!className || !eventName) return;

        const flags = this.featureFlagsService.flags[event.guild!.id];
        if (!flags) return;

        if (!this.eventsCache.has(event.id)) {
            if (event.status === GuildScheduledEventStatus.Completed || event.status === GuildScheduledEventStatus.Canceled) return;
            this.eventsCache.set(event.id, { notified: false, maxParticipants: 0, reported: false });
        }

        const state = this.eventsCache.get(event.id)!;
        const now = Date.now();
        const startTs = event.scheduledStartTimestamp!;

        const isStudyGroup = this.studyGroupPossibleNames.some(name => eventName.includes(name));
        const hasVoiceChannel = event.channelId !== null;

        if (flags["enviar_aviso_de_eventos"] && !state.notified) {
            const timeUntilStart = startTs - now;
            if (timeUntilStart <= Number(process.env.REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES) * 60 * 1000 && timeUntilStart > 0) {
                await this.handleNotification(event, className);
                state.notified = true;
            }
        }

        if (hasVoiceChannel && isStudyGroup) {

            if (flags["comecar_grupo_de_estudos_automaticamente"] && event.status === GuildScheduledEventStatus.Scheduled) {
                if (now >= startTs) {
                    await event.setStatus(GuildScheduledEventStatus.Active);
                }
            }

            if (flags["coletar_dados_de_grupos_de_estudo"] && event.status === GuildScheduledEventStatus.Active) {
                const voiceChannel = event.channel as VoiceChannel | null;
                if (voiceChannel && voiceChannel.isVoiceBased()) {
                    const currentParticipants = voiceChannel.members.size;
                    if (currentParticipants > state.maxParticipants) {
                        state.maxParticipants = currentParticipants;
                    }
                }
            }
        }

        if (event.status === GuildScheduledEventStatus.Active) {
            if (now - startTs >= this.ONE_HOUR_AND_HALF_IN_MILLISECONDS) {
                await event.setStatus(GuildScheduledEventStatus.Completed);
            }
        }

        const isEnded = event.status === GuildScheduledEventStatus.Completed || event.status === GuildScheduledEventStatus.Canceled;

        if (isEnded && !state.reported) {
            if (hasVoiceChannel && flags["coletar_dados_de_grupos_de_estudo"] && isStudyGroup) {
                await this.handleEventCompletion(event, state.maxParticipants, className);
            }

            state.reported = true;
            this.eventsCache.delete(event.id);
        }

        this.manageCacheSize();
    }

    private async processGuild(guild: Guild) {
        await Promise.allSettled(guild.scheduledEvents.cache.values().map(event => this.processEvent(event)));
    }

    private async getMembersByRole(guild: Guild) {
        // [Seu código original mantido aqui]
        const roles: Collection<string, Role> = await guild.roles.fetch();
        const members: Collection<string, GuildMember> = await guild.members.fetch();

        interface RoleCount {
            roleName: string;
            count: number;
        }

        const roleCounts: RoleCount[] = [];

        roles.forEach(role => {
            if (role.name) roleCounts.push({roleName: role.name, count: members.filter(member => member.roles.cache.has(role.id)).size});
        });

        return roleCounts;
    }

    async handleEventVerification() {
        console.time("Verificação de eventos");
        await Promise.allSettled(this.client.guilds.cache.values().map((guild) => this.processGuild(guild)));
        console.timeEnd("Verificação de eventos");
    }

    async handleMembersCount() {
        console.time("Contagem de membros");
        interface RoleCount {
            roleName: string;
            count: number;
        }

        interface Payload {
            guildName: string;
            data: RoleCount[]
        }

        let payload: Payload[] = [];

        for (const guild of this.client.guilds.cache.values()) {
            if (this.featureFlagsService.flags[guild.id!]?.['coletar_dados_de_membros_mensalmente'] === false) continue;
            payload.push({guildName: guild.name, data: await this.getMembersByRole(guild)});
        }

        const res = await fetch(`${process.env.N8N_ENDPOINT}/salvarMembros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + process.env.N8N_WEBHOOKS_TOKEN as string
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) console.error(`Erro ao enviar dados para o n8n: ${JSON.stringify(res, null, 2)}`);
        console.timeEnd("Contagem de membros");
    }
}