import {
    GuildScheduledEvent,
    GuildScheduledEventStatus,
    ChannelType,
    TextChannel,
} from 'discord.js';
import type {
    IEventProcessor,
    INotificationDispatcher,
} from '../../types/modularScheduler.interfaces.ts';
import type IFeatureFlagsService from '../../types/featureFlagsService.interface.ts';
import type { IWarningRepository } from '../../types/repository.interfaces.ts';
import {
    STUDY_GROUP_POSSIBLE_NAMES,
    WARNING_CHANNEL_NAME,
} from '../../constants/discordConstants.ts';
import { env } from '../../config/env.ts';
import type { EventState } from '../../types/discord.interfaces.ts';

/**
 * EventProcessorService - Gerencia o ciclo de vida e o estado de notificação dos eventos do Discord
 * Implementa IEventProcessor
 *
 * Responsabilidades:
 * - Lidar com a lógica de notificação de eventos (verificação de flags, tempo e despacho)
 * - Gerenciar o início automático de grupos de estudo
 * - Lidar com a conclusão automática de eventos após o tempo limite (timeout)
 * - Manter um cache interno dos estados dos eventos
 *
 * SOLID: Responsabilidade Única (Single Responsibility) - Apenas gerencia as transições de estado de eventos individuais
 */
export default class EventProcessorService implements IEventProcessor {
    constructor(
        private readonly featureFlagsService: IFeatureFlagsService,
        private readonly notificationDispatcher: INotificationDispatcher,
        private readonly databaseWarningRepository: IWarningRepository,
        private readonly eventsCache: Map<string, EventState>,
    ) {}

    /**
     * Processa o estado de um único evento
     */
    async process(event: GuildScheduledEvent): Promise<void> {
        // 1. Limpar eventos concluídos/cancelados
        if (
            event.status === GuildScheduledEventStatus.Completed ||
            event.status === GuildScheduledEventStatus.Canceled
        ) {
            this.eventsCache.delete(event.id);
            return;
        }

        const [className, eventName] = event.name.split(' - ');
        if (!className || !eventName) return;

        // 2. Inicializar ou recuperar o estado do cache
        let state = this.eventsCache.get(event.id);
        if (!state) {
            state = { notified: false, guildID: event.guildId! };
            this.eventsCache.set(event.id, state);
        }

        const now = Date.now();
        const startTs = event.scheduledStartTimestamp!;
        const guildId = event.guildId!;

        // 3. Lidar com o despacho de notificações
        await this.handleEventNotification(event, state, className, now, startTs, guildId);

        // 4. Lidar com o início automático
        await this.handleAutoStart(event, eventName, now, startTs, guildId);

        // 5. Lidar com a conclusão automática (Timeout)
        await this.handleAutoCompletion(event, now, startTs);
    }

    private async handleEventNotification(
        event: GuildScheduledEvent,
        state: EventState,
        className: string,
        now: number,
        startTs: number,
        guildId: string,
    ): Promise<void> {
        if (
            state.notified ||
            !this.featureFlagsService.isEnabled(guildId, 'enviar_aviso_de_eventos')
        ) {
            return;
        }

        const timeUntilStart = startTs - now;
        const warningTimeMs = env.REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES * 60 * 1000;

        if (timeUntilStart > 0 && timeUntilStart <= warningTimeMs) {
            await this.dispatchToChannels(event, className);
            state.notified = true;
        }
    }

    private async dispatchToChannels(event: GuildScheduledEvent, className: string): Promise<void> {
        const guild = event.guild!;
        const classRole = guild.roles.cache.find((role) => role.name === 'Estudantes ' + className);
        const warningChannels = guild.channels.cache.filter(
            (channel) => channel.type === ChannelType.GuildText && channel.name === WARNING_CHANNEL_NAME,
        );

        if (event.channelId) {
            const parentId = guild.channels.cache.get(event.channelId)?.parentId;
            const targetChannel = warningChannels.find(
                (channel) => (channel as TextChannel).parentId === parentId,
            ) as TextChannel | undefined;

            if (targetChannel) {
                const messageSent = await this.databaseWarningRepository.check(targetChannel.id);
                if (!messageSent) {
                    await this.notificationDispatcher.dispatchWarning(
                        classRole,
                        event.url,
                        event.scheduledStartTimestamp!,
                        targetChannel,
                    );
                }
            }
        } else {
            // Alternativa (Fallback): enviar para todos os canais de aviso se nenhum canal específico estiver associado ao evento
            for (const channel of warningChannels.values()) {
                await this.notificationDispatcher.dispatchWarning(
                    classRole,
                    event.url,
                    event.scheduledStartTimestamp!,
                    channel as TextChannel,
                );
            }
        }
    }

    private async handleAutoStart(
        event: GuildScheduledEvent,
        eventName: string,
        now: number,
        startTs: number,
        guildId: string,
    ): Promise<void> {
        if (event.status !== GuildScheduledEventStatus.Scheduled || now < startTs) {
            return;
        }

        const isStudyGroup = STUDY_GROUP_POSSIBLE_NAMES.some((name) => eventName.includes(name));
        const autoStartEnabled = this.featureFlagsService.isEnabled(
            guildId,
            'comecar_grupo_de_estudos_automaticamente',
        );

        if (event.channelId && isStudyGroup && autoStartEnabled) {
            await event.setStatus(GuildScheduledEventStatus.Active);
        }
    }

    private async handleAutoCompletion(
        event: GuildScheduledEvent,
        now: number,
        startTs: number,
    ): Promise<void> {
        if (event.status !== GuildScheduledEventStatus.Active) {
            return;
        }

        const durationLimitMs = env.MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS * 60 * 60 * 1000;
        if (now - startTs >= durationLimitMs) {
            await event.setStatus(GuildScheduledEventStatus.Completed);
            this.eventsCache.delete(event.id);
        }
    }
}
