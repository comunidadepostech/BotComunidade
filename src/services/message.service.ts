import type { Channel } from '../types/channel.types';
import type BroadcastMessageDTO from '../types/dtos/broadcastMessage.dtos';
import type IChannelProvider from '../types/providers/discord/channelProvider.interface';
import type IMessageProvider from '../types/providers/discord/messageProvider.interface';
import type IGuildProvider from '../types/providers/discord/guildProvider.interface';
import type IGuildsRepository from '../types/repositories/guildsRepository.interface';
import type IMessageService from '../types/services/messageService.interface';
import type { Attachment } from '../types/attachment.type';
import type ILoggerService from '../types/services/loggerService.interface';
import type IMessageRepository from '../types/repositories/messageRepository.interface';
import type PollMessageDTO from '../types/dtos/pollMessage.dto';
import { SomeBatchError } from '../types/errors.types';
import type WelcomeMessageDTO from '../types/dtos/welcomeMessage.dto';
import type IImageProvider from '../types/providers/images/imageProvider.interface';
import type IN8NMessageProvider from '../types/providers/n8n/messageProvider.interface';
import type MessageSaveDTO from '../types/dtos/messageSave.dto';
import type SavePollMessageDTO from '../types/dtos/savePollMessage.dto';
import type IWarningRepository from '../types/repositories/warningRepository.interface';
import type IRoleProvider from '../types/providers/discord/roleProvider.interface';
import { STUDENT_ROLE_NAME_PREFIX, WARNING_CHANNEL_NAME } from '../utils/constants/discordConstants';
import env from '../config/env';
import type { Event } from '../types/event.type';
import type VacancyDTO from '../types/dtos/vacancy.dto';
import type IThreadProvider from '../types/providers/discord/threadProvider.interface';
import type { MessageAction } from '../types/component.types';

export default class MessageService implements IMessageService {
    constructor(
        private messageProvider: IMessageProvider,
        private guildsRepository: IGuildsRepository,
        private guildProvider: IGuildProvider,
        private channelProvider: IChannelProvider,
        private logger: ILoggerService,
        private messageRepository: IMessageRepository,
        private imageProvider: IImageProvider,
        private n8nMessageProvider: IN8NMessageProvider,
        private warningRepository: IWarningRepository,
        private roleProvider: IRoleProvider,
        private threadProvider: IThreadProvider,
    ) {}

    async deleteMessage(channelId: string, messageId: string): Promise<void> {
        await this.messageProvider.deleteMessage(channelId, messageId);
    }

    async sendMessage(
        channel: Channel,
        content: string,
        options?: { attachment?: Attachment[]; actions?: MessageAction[]; replyTo?: string },
    ): Promise<string> {
        return await this.messageProvider.sendMessage(channel, content, options);
    }

    async sendPoll(dto: PollMessageDTO, channel: Channel[] | Channel): Promise<void> {
        if (channel instanceof Array) {
            for (const ch of channel) {
                await this.messageProvider.createPoll(dto, ch);
            }
            return;
        }

        await this.messageProvider.createPoll(dto, channel);
    }

    async saveMessage(dto: MessageSaveDTO): Promise<void> {
        await this.messageRepository.saveMessage({
            message_id: dto.message.id,
            guild_name: dto.message.guild.name,
            category: dto.category,
            role_name: dto.role.name,
            user_name: dto.message.author.globalName ?? dto.message.author.username,
            channel_name: dto.message.channel.name,
            message: dto.message.content,
            thread_name: dto.threadName,
        });

        await this.n8nMessageProvider.saveMessage({
            createdBy: dto.message.author.globalName ?? dto.message.author.username,
            guild: dto.message.guild.name,
            message: dto.message.content,
            timestamp: dto.message.createdAt.getTime().toString(),
            id: dto.message.id,
            authorRole: dto.role.name,
            thread: dto.threadName,
            channel: dto.message.channel.name,
            class: dto.category,
        });
    }

    async broadcast(dto: BroadcastMessageDTO): Promise<void> {
        if (dto.onlyTargetChannel) {
            await this.messageProvider.sendMessage(dto.targetChannel, dto.content, { attachment: dto.files });
            return;
        }

        const allGuildIds = Array.from(this.guildProvider.getAllGuilds().keys());
        let guildIds = allGuildIds;

        if (dto.targetClusters?.length) {
            const clusterGuildIds = new Set<string>();

            for (const cluster of dto.targetClusters) {
                const guildIdsByCluster = await this.guildsRepository.getGuildIdsByCluster(cluster);
                guildIdsByCluster.forEach((guildId) => clusterGuildIds.add(guildId));
            }

            guildIds = allGuildIds.filter((guildId) => clusterGuildIds.has(guildId));
        }

        const channels: Channel[] = [];
        for (const guildId of guildIds) {
            channels.push(...(await this.channelProvider.getChannelsByGuildId(guildId)));
        }

        const filteredChannels = channels.filter((channel) => channel.name === dto.targetChannel.name);

        let failures = 0;

        const results = await Promise.allSettled(
            filteredChannels.map((channel) =>
                this.messageProvider.sendMessage(channel, dto.content, { attachment: dto.files }),
            ),
        );

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                failures++;
                const channel = filteredChannels[index];
                const error = result.reason;

                this.logger.error(
                    `Failed to send broadcast message in ${channel!.name} channel in ${channel!.guild?.name ?? 'Unknown'}`,
                    {
                        error: error?.message ?? error,
                    },
                );
            }
        });

        if (failures > 0) throw new SomeBatchError(failures, filteredChannels.length);
    }

    async editMessage(channelId: string, messageId: string, content: string): Promise<void> {
        await this.messageProvider.editMessage(channelId, messageId, content);
    }

    async sendWelcomeMessage(dto: WelcomeMessageDTO): Promise<void> {
        const welcomeImageBuffer = await this.imageProvider.generateWelcomeImage(
            dto.memberName,
            dto.memberAvatarURL,
            'Bem vindo!',
        );

        await this.messageProvider.sendMessage(
            dto.channel,
            `## Olá, <@${dto.memberId}>!\nBem vindo a nossa Comunidade Pos Tech!`,
            { attachment: [welcomeImageBuffer] },
        );
    }

    // eslint-disable-next-line complexity
    async savePoll(dto: SavePollMessageDTO): Promise<void> {
        await this.messageRepository.savePoll({
            poll_hash: dto.hash,
            guild_name: dto.guildName,
            poll_question: dto.poll_question,
            category: dto.category,
            response1_text: dto.responses[0]!.text!,
            response1_value: dto.responses[0]!.votes!,
            response2_text: dto.responses[1]!.text!,
            response2_value: dto.responses[1]!.votes!,
            response3_text: dto.responses[2]?.text,
            response3_value: dto.responses[2]?.votes,
            response4_text: dto.responses[3]?.text,
            response4_value: dto.responses[3]?.votes,
            response5_text: dto.responses[4]?.text,
            response5_value: dto.responses[4]?.votes,
            response6_text: dto.responses[5]?.text,
            response6_value: dto.responses[5]?.votes,
            response7_text: dto.responses[6]?.text,
            response7_value: dto.responses[6]?.votes,
            response8_text: dto.responses[7]?.text,
            response8_value: dto.responses[7]?.votes,
            response9_text: dto.responses[8]?.text,
            response9_value: dto.responses[8]?.votes,
            response10_text: dto.responses[9]?.text,
            response10_value: dto.responses[9]?.votes,
        });

        await this.n8nMessageProvider.savePoll({
            created_by: dto.createdBy,
            guild: dto.guildName,
            poll_category: dto.category,
            poll_hash: dto.hash,
            question: dto.poll_question,
            answers: dto.responses.map((response) => ({
                response: response?.text,
                answers: response?.votes,
            })),
            duration: dto.duration,
        });
    }

    async clearEventWarnings(): Promise<void> {
        for (const message of this.warningRepository.listWarningMessages()) {
            const guildMessage = await this.messageProvider.getMessageById(message.channel_id, message.message_id);

            if (
                Date.now() - guildMessage.createdAt.getTime() >
                env.CLEAR_WARNING_MESSAGES_AFTER_X_HOURS * 60 * 60 * 1000
            ) {
                await this.messageProvider.deleteMessage(guildMessage.channel.id, guildMessage.id).catch(() => {});
                await this.warningRepository.deleteWarningMessage(message.message_id);
            }
        }
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    async sendEventWarning(events: Event<true>[]): Promise<void> {
        // Ignores any event that is not in the time window
        events = events.filter((event) => {
            const remaining = event.scheduledStart.getTime() - Date.now();
            return remaining > 0 && remaining <= env.REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES * 60 * 1000;
        });

        for (const event of events) {
            // Check if the event warning was already posted
            if (this.warningRepository.listWarningMessages().find((message) => message.event_id === event.id)) {
                continue;
            }

            // Send the event to the warning channel if it's private, otherwise send it to all warning channels in the guild
            if (typeof event.location !== 'string') {
                const parentName = event.location.parent?.name;

                if (!parentName) {
                    this.logger.warn('Event warning skipped bacause it does not have a parent (category)', {
                        event,
                    });
                    continue;
                }

                const roleId = await this.roleProvider.getRoleIdByName(
                    event.location.guild.id,
                    `${STUDENT_ROLE_NAME_PREFIX} ${parentName}`,
                );

                const targetChannel = (
                    await this.channelProvider.getChannelsByName(event.location.guild.id, WARNING_CHANNEL_NAME)
                ).find((channel) => channel.parent?.name === parentName);

                if (!targetChannel) {
                    this.logger.warn('Event warning skipped because was not possible to find a warning channel', {
                        event,
                    });
                    continue;
                }

                const messageId = await this.messageProvider.sendMessage(
                    targetChannel,
                    `Boa noite, turma!! <@&${roleId}>\n\nPassando para lembrar vocês do nosso evento de hoje às ${event.scheduledStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} 🚀\nacesse o card do evento [aqui](${event.url})`,
                );

                await this.warningRepository.saveWarningMessage(targetChannel.id, messageId, event.id);
                continue;
            }

            const channels = await this.channelProvider.getChannelsByName(event.guildId, WARNING_CHANNEL_NAME);

            for (const channel of channels) {
                // Check if the event warning was already posted
                if (this.warningRepository.listWarningMessages().find((message) => message.event_id === event.id)) {
                    continue;
                }

                const roleId = await this.roleProvider.getRoleIdByName(
                    event.guildId,
                    `${STUDENT_ROLE_NAME_PREFIX} ${channel.parent!.name}`,
                );

                const messageId = await this.messageProvider.sendMessage(
                    channel,
                    `Boa noite, turma!! <@&${roleId}>\n\nPassando para lembrar vocês do nosso evento de hoje às ${event.scheduledStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} 🚀\nacesse o card do evento [aqui](${event.url})`,
                );

                await this.warningRepository.saveWarningMessage(channel.id, messageId, event.id);
            }
        }
    }

    async sendVacancyMessage(vacancy: VacancyDTO): Promise<void> {
        for (const channel of vacancy.threads) {
            const threadId = await this.threadProvider.createThread(
                channel.id,
                vacancy.title,
                vacancy.header.join('\n'),
            );

            const thread = await this.channelProvider.getChannelById(channel.guild.id, threadId);

            for (const chunk of vacancy.body) {
                await this.messageProvider.sendMessage(thread, chunk);
            }

            await this.messageProvider.sendMessage(thread, vacancy.footer, { actions: vacancy.actions });
        }
    }
}
