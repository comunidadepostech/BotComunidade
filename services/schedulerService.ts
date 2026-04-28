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

export class SchedulerService {
    private eventsCache = new Map<string, EventState>();

    constructor(
        private client: Client,
        private readonly featureFlagsService: FeatureFlagsService,
        private readonly n8nService: N8nService,
        private readonly databaseWarningRepository: DatabaseWarningRepository,
    ) {}

    private async sendWarning(
        classRole: Role | undefined,
        eventUrl: string,
        scheduledStartTimestamp: number,
        channel: TextChannel,
    ): Promise<void> {
        const date = new Date(scheduledStartTimestamp);
        const hours = date.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
        });

        const message = await channel.send(
            `Boa noite, turma!! ${classRole ? classRole.toString() : ''}\n\n` +
                `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
                `acesse o card do evento [aqui](${eventUrl})`,
        );

        await this.databaseWarningRepository.save(message.id, message.channelId);
    }

    private async handleNotification(event: GuildScheduledEvent, className: string): Promise<void> {
        const classRole = event.guild!.roles.cache.find(
            (role) => role.name === 'Estudantes ' + className,
        );

        const warningChannels = event.guild!.channels.cache.filter(
            (channel) =>
                channel.type === ChannelType.GuildText && channel.name === WARNING_CHANNEL_NAME,
        );

        if (event.channelId) {
            const parentId = event.guild!.channels.cache.get(event.channelId)?.parentId;

            const targetChannel = warningChannels.find(
                (channel) => channel.parentId === parentId,
            ) as TextChannel | undefined;

            if (targetChannel) {
                const messageSent = await this.databaseWarningRepository.check(targetChannel.id);
                if (!messageSent)
                    await this.sendWarning(
                        classRole,
                        event.url,
                        event.scheduledStartTimestamp!,
                        targetChannel,
                    );
            }
        } else {
            for (const channel of warningChannels.values()) {
                await this.sendWarning(
                    classRole,
                    event.url,
                    event.scheduledStartTimestamp!,
                    channel as TextChannel,
                );
            }
        }
    }

    private async processEvent(event: GuildScheduledEvent): Promise<void> {
        // Tratamento de encerramento e limpeza do cache (Evita vazamento de memória e processamento desnecessário em eventos antigos)
        if (
            event.status === GuildScheduledEventStatus.Completed ||
            event.status === GuildScheduledEventStatus.Canceled
        ) {
            this.eventsCache.delete(event.id);
            return;
        }

        // Validação e extração de variáveis (o split já lida com a ausência do " - ")
        const [className, eventName] = event.name.split(' - ');
        if (!className || !eventName) return;

        // Recupera ou inicializa o cache
        let state = this.eventsCache.get(event.id);
        if (!state) {
            state = {
                notified: false,
                guildID: event.guildId,
            };
            this.eventsCache.set(event.id, state);
        }

        const now = Date.now();
        const startTs = event.scheduledStartTimestamp!;
        const guildId = event.guildId!;

        // Disparo da notificação
        if (
            !state.notified &&
            this.featureFlagsService.isEnabled(guildId, 'enviar_aviso_de_eventos')
        ) {
            const timeUntilStart = startTs - now;
            const warningTimeMs = env.REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES * 60 * 1000;

            if (timeUntilStart > 0 && timeUntilStart <= warningTimeMs) {
                await this.handleNotification(event, className);
                state.notified = true;
            }
        }

        // Início automático
        if (event.status === GuildScheduledEventStatus.Scheduled && now >= startTs) {
            // O loop no array só acontece se realmente estiver na hora de iniciar o evento
            const isStudyGroup = STUDY_GROUP_POSSIBLE_NAMES.some((name) =>
                eventName.includes(name),
            );

            if (
                event.channelId &&
                isStudyGroup &&
                this.featureFlagsService.isEnabled(guildId,'comecar_grupo_de_estudos_automaticamente')
            ) {
                await event.setStatus(GuildScheduledEventStatus.Active);
            }
        }

        // Encerramento automático pelo tempo limite
        if (
            event.status === GuildScheduledEventStatus.Active &&
            now - startTs >= env.MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS * 60 * 60 * 1000
        ) {
            await event.setStatus(GuildScheduledEventStatus.Completed);
            this.eventsCache.delete(event.id);
        }
    }

    async handleEventVerification(): Promise<void> {
        console.time('Verificação de eventos');
        await Promise.allSettled(
            this.client.guilds.cache.values().map(async (guild) => {
                await Promise.allSettled(
                    guild.scheduledEvents.cache.values().map((event) => this.processEvent(event)),
                );
            }),
        );
        console.timeEnd('Verificação de eventos');
    }

    async handleMembersCount(): Promise<void> {
        async function getMembersByRole(guild: Guild): Promise<RoleCount[]> {
            const roles: Collection<string, Role> = await guild.roles.fetch();
            const members: Collection<string, GuildMember> = await guild.members.fetch();

            const roleCounts: RoleCount[] = [];

            roles.forEach((role) => {
                if (!role.name.search('Estudantes '))
                    roleCounts.push({
                        guildName: role.guild.name,
                        roleName: role.name.split('Estudantes ')[1]!,
                        count: members.filter((member) => member.roles.cache.has(role.id)).size,
                    });
            });

            return roleCounts;
        }

        console.time('Contagem de membros');

        const payload: SaveMembersDto = [];

        for (const guild of this.client.guilds.cache.values()) {
            if (
                !this.featureFlagsService.getFlag(guild.id!, 'coletar_dados_de_membros_mensalmente')
            )
                continue;
            payload.push(...(await getMembersByRole(guild)));
        }

        await this.n8nService.saveRolesMembersCount(payload);
        console.timeEnd('Contagem de membros');
    }

    async handleOnlineMembersCount(): Promise<void> {
        let payload = 0;

        for (const guild of this.client.guilds.cache.values()) {
            let members = await guild.members.fetch({ withPresences: true });
            members = members.filter((member) => {
                return (
                    member.presence &&
                    [
                        PresenceUpdateStatus.Online,
                        PresenceUpdateStatus.Idle,
                        PresenceUpdateStatus.Invisible,
                        PresenceUpdateStatus.DoNotDisturb,
                    ].includes(member.presence.status)
                );
            });

            payload += members.size;
        }

        await this.n8nService.saveOnlineMembers(payload);
    }

    async handleEventWarningMessagesDelete(): Promise<void> {
        const messages = (await this.databaseWarningRepository.check()) as WarningMessageRow[];

        if (!messages || messages.length === 0) return;

        for (const { message_id, channel_id } of messages) {
            const channel = await this.client.channels.fetch(channel_id);

            if (!channel) continue;
            if (!channel.isTextBased()) continue;

            const message = await channel.messages
                .fetch(message_id)
                .catch((error) =>
                    error instanceof Error ? console.error(error.message) : console.error(error),
                );

            if (!message) continue;

            if (message.deletable) await channel.messages.delete(message_id);
        }

        this.databaseWarningRepository.delete();
    }

    async handleEventCacheClear(): Promise<void> {
        for (const eventID of this.eventsCache.keys()) {
            const guild = await this.client.guilds.fetch(this.eventsCache.get(eventID)!.guildID);
            if (!guild.scheduledEvents.cache.has(eventID)) {
                this.eventsCache.delete(eventID);
            }
        }
    }
}