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
    PresenceUpdateStatus
} from "discord.js";
import FeatureFlagsService from "./featureFlagsService.ts";
import {STUDY_GROUP_POSSIBLE_NAMES, WARNING_CHANNEL_NAME} from "../constants/discordConstants.ts";
import N8nService from "./n8nService.ts";
import {env} from "../config/env.ts";
import type {EventState, RoleCount} from "../types/discord.interfaces.ts";
import type {SaveMembersDto} from "../dtos/saveMembers.dto.ts";
import type DatabaseWarningRepository from "../repositories/database/databaseWarningRepository.ts";
import type {WarningMessageRow} from "../types/database.interfaces.ts";
import {ONE_HOUR_AND_HALF_IN_MILLISECONDS} from "../constants/globalConstants.ts";

export class SchedulerService {
    private eventsCache = new Map<string, EventState>();
    private maxEventsCacheSize = 3000 // Número apropriado, deve ser maior caso a média de eventos cresça

    constructor(
        private client: Client,
        private readonly featureFlagsService: FeatureFlagsService,
        private readonly n8nService: N8nService,
        private readonly databaseWarningRepository: DatabaseWarningRepository
    ) {}

    private async handleEventCompletion(event: GuildScheduledEvent, peakParticipants: number, className: string): Promise<void> {
        try {
            await this.n8nService.saveStudyGroupAnalysis({
                curso: event.guild!.name,
                turma: className,
                maximoDeParticipantes: peakParticipants
            })
        } catch (error) {
            if (error instanceof Error) console.error(error.message)
        }
    }

    private async sendWarning(classRole: Role | undefined, eventUrl: string, scheduledStartTimestamp: number, channel: TextChannel): Promise<void> {
        const date = new Date(scheduledStartTimestamp);
        const hours = date.toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit"
        });

        const message = await channel.send(
            `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
            `acesse o card do evento [aqui](${eventUrl})`
        );

        await this.databaseWarningRepository.save(message.id, message.channelId)
    }

    private async handleNotification(event: GuildScheduledEvent, className: string): Promise<void> {
        const classRole = event.guild!.roles.cache.find(role => role.name === "Estudantes " + className);

        const warningChannels = event.guild!.channels.cache.filter(
            channel => channel.type === ChannelType.GuildText && channel.name === WARNING_CHANNEL_NAME
        );

        if (event.channelId) {
            const voiceChannel = event.guild!.channels.cache.get(event.channelId);
            const parentId = voiceChannel?.parentId;

            const targetChannel = warningChannels.find(channel => channel.parentId === parentId) as TextChannel | undefined;

            if (targetChannel) {
                const messageSent = await this.databaseWarningRepository.check(targetChannel.id)
                if (!messageSent) await this.sendWarning(classRole, event.url, event.scheduledStartTimestamp!, targetChannel);
            }
        } else {
            for (const channel of warningChannels.values()) {
                await this.sendWarning(classRole, event.url, event.scheduledStartTimestamp!, channel as TextChannel);
            }
        }
    }

    private manageCacheSize(): void {
        if (this.eventsCache.size > this.maxEventsCacheSize) {
            const firstKey = this.eventsCache.keys().next().value;
            if (firstKey) this.eventsCache.delete(firstKey);
        }
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity, complexity
    private async processEvent(event: GuildScheduledEvent): Promise<void> {

        // Se o evento já estiver concuido ou se tiver sido cancelado então ignora
        if (
            event.status === GuildScheduledEventStatus.Completed || 
            event.status === GuildScheduledEventStatus.Canceled
        ) return;

        // O " - " separa a turma no primeiro item e o nome do evento no segundo item, sem isso não é possível determinar a turma
        if (!event.name.includes(" - ")) return;
        const [className, eventName] = event.name.split(" - ");
        if (!className || !eventName) return;

        // Verifica se o servidor tem flags
        const flags = this.featureFlagsService.flags[event.guild!.id];
        if (!flags) return;

        // Se o evento não tiver no cache então adiciona
        if (!this.eventsCache.has(event.id)) {
            this.eventsCache.set(event.id, { notified: false, maxParticipants: 0, reported: false, guildID: event.guildId });
        }

        const state = this.eventsCache.get(event.id)!;
        const now = Date.now();
        const startTs = event.scheduledStartTimestamp!;
        const isStudyGroup = STUDY_GROUP_POSSIBLE_NAMES.some(name => eventName.includes(name));
        const hasVoiceChannel = event.channelId !== null;

        // Se o servidor permitir o envio do aviso no tempo correto então envia e salva o estado no cache como state.notified = true para evitar duplicidade
        if (flags["enviar_aviso_de_eventos"] && !state.notified) {
            const timeUntilStart = startTs - now;
            if (timeUntilStart <= env.REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES  * 60 * 1000 && timeUntilStart > 0) {
                await this.handleNotification(event, className);
                state.notified = true;
            }
        }

        // Verifica se é necessário começar o grupo de estudos automaticamente ou se coletar dados (para coletar dados é necessário que o evento seja inicializado)
        if (hasVoiceChannel && isStudyGroup) {
            if (
                flags["comecar_grupo_de_estudos_automaticamente"] && 
                event.status === GuildScheduledEventStatus.Scheduled && 
                now >= startTs
            ) {
                await event.setStatus(GuildScheduledEventStatus.Active);
            }

            if (
                flags["coletar_dados_de_grupos_de_estudo"] &&
                event.status === GuildScheduledEventStatus.Active
            ) {
                const voiceChannel = await event.guild?.channels.fetch(event.channelId!);

                if (voiceChannel && voiceChannel.isVoiceBased() && voiceChannel.members.size > state.maxParticipants) {
                    state.maxParticipants = voiceChannel.members.size;
                }
            }
        }

        // Se o evento estiver ativo e tiver passado do prazo então encerra o evento
        if (event.status === GuildScheduledEventStatus.Active && now - startTs >= ONE_HOUR_AND_HALF_IN_MILLISECONDS) {
            await event.setStatus(GuildScheduledEventStatus.Completed);
        }

        const isEnded = [GuildScheduledEventStatus.Completed, GuildScheduledEventStatus.Canceled].includes(event.status)

        // Se o evento tiver terminado e tiver que coletar dados então ele os salva e limpa do cache
        if (isEnded && !state.reported && hasVoiceChannel && flags["coletar_dados_de_grupos_de_estudo"] && isStudyGroup) {
            await this.handleEventCompletion(event, state.maxParticipants, className);
            state.reported = true;
            this.eventsCache.delete(event.id);
        }

        // Usado para prevenir que o cache cresça indefinidamente
        this.manageCacheSize();
    }

    async handleEventVerification(): Promise<void> {
        console.time("Verificação de eventos");
        await Promise.allSettled(this.client.guilds.cache.values().map(async (guild) => {
            await Promise.allSettled(guild.scheduledEvents.cache.values().map(event => this.processEvent(event)))
        }));
        console.timeEnd("Verificação de eventos");
    }

    async handleMembersCount(): Promise<void> {
        async function getMembersByRole(guild: Guild): Promise<RoleCount[]> {
            const roles: Collection<string, Role> = await guild.roles.fetch();
            const members: Collection<string, GuildMember> = await guild.members.fetch();

            const roleCounts: RoleCount[] = [];

            roles.forEach(role => {
                if (role.name) roleCounts.push({
                    guildName: role.guild.name, 
                    roleName: role.name, 
                    count: members.filter(member => member.roles.cache.has(role.id)).size
                });
            });

            return roleCounts;
        }

        console.time("Contagem de membros");

        const payload: SaveMembersDto = [];

        for (const guild of this.client.guilds.cache.values()) {
            if (!this.featureFlagsService.getFlag(guild.id!, 'coletar_dados_de_membros_mensalmente')) continue;
            payload.push(...await getMembersByRole(guild));
        }

        await this.n8nService.saveRolesMembersCount(payload)
        console.timeEnd("Contagem de membros");
    }

    async handleOnlineMembersCount(): Promise<void> {
        let payload = 0

        for (const guild of this.client.guilds.cache.values()) {
            let members = await guild.members.fetch({ withPresences: true });
            members = members.filter(member => {
                return member.presence && [
                    PresenceUpdateStatus.Online,
                    PresenceUpdateStatus.Idle,
                    PresenceUpdateStatus.Invisible, 
                    PresenceUpdateStatus.DoNotDisturb
                ].includes(member.presence.status);
            });

            payload += members.size
        }

        await this.n8nService.saveOnlineMembers(payload)
    }

    async handleEventWarningMessagesDelete(): Promise<void> {
        const messages = await this.databaseWarningRepository.check() as WarningMessageRow[]

        if (!messages || messages.length === 0) return

        for (const {messageID, channlID} of messages) {
            const channel = await this.client.channels.fetch(channlID)

            if (!channel) continue
            if (!channel.isTextBased()) continue

            const message = await channel.messages.fetch(messageID)
                .catch((error) => (error instanceof Error) ? console.error(error.message) : console.error(error))

            if (!message) continue

            if (message.deletable) await channel.messages.delete(messageID)
        }

        this.databaseWarningRepository.delete()
    }

    async handleEventCacheClear(): Promise<void> {
        let guild: Guild
        for (const eventID of this.eventsCache.keys()) {
            guild = await this.client.guilds.fetch(this.eventsCache.get(eventID)!.guildID)
            if (!guild.scheduledEvents.cache.has(eventID)) {
                this.eventsCache.delete(eventID)
            }
        }
    }
}