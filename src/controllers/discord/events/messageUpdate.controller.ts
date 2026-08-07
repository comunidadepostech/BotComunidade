import { ChannelType, ForumChannel, Message, MessageType, type OmitPartialGroupDMChannel, type PartialMessage } from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';
import type IFeatureFlagsService from '../../../types/services/featureFlagsService.interface';
import type IMessageService from '../../../types/services/messageService.interface';
import type IHashingService from '../../../types/services/hashingService.interface';

export default class MessageUpdateEventController implements IController {
    constructor(
        private logger: ILoggerService,
        private flagService: IFeatureFlagsService,
        private messageService: IMessageService,
        private hashingService: IHashingService,
    ) {}

    async handle(message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage<boolean>>): Promise<void> {
        if (message.partial) message = await message.fetch();
        
        // Ignore system messages, empty messages, messages that are only mentions, and messages from bots
        if (
            !message.guild ||
            ![
                ChannelType.GuildText,
                ChannelType.PublicThread,
                ChannelType.GuildStageVoice,
                ChannelType.GuildVoice,
            ].includes(message.channel.type) ||
            !this.flagService.isEnabled(message.guild!.id, 'salvar_enquetes') ||
            !message.poll ||
            !message.poll!.resultsFinalized ||
            message.type === MessageType.PollResult
        ) {
            return;
        }

        const pollhash = this.hashingService.generatePollHash(
            message.createdAt.getMonth().toString(),
            message.createdAt.getFullYear().toString(),
            message.poll!.question.text!,
        );

        const duration = (
            (new Date().getTime() - new Date(message.poll!.expiresTimestamp!).getTime()) /
            (1000 * 60 * 60)
        ).toFixed(0);

        const channel = await message.channel.fetch();

        if (!channel || channel.isDMBased()) return;

        // Check if the channel has a parent (category) and return if it doesn't
        if (!channel.parent) {
            this.logger.warn(
                "Poll not saved because it doesn't has a parent, ensure all the channels in the guild has a parent (category)",
                {
                    guildId: message.guildId,
                    messageId: message.id,
                    content: message.content.slice(0, 50),
                    channel: channel.name,
                },
            );
            return;
        }

        const isNormalChannel = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(
            message.channel.type,
        );

        await this.messageService.savePoll({
            guildName: message.guild!.name,
            category: isNormalChannel
                ? channel.parent.name
                : ((await message.guild!.channels.fetch(channel.parent.id)) as ForumChannel).parent!.name,
            poll_question: message.poll!.question.text!,
            responses: message.poll!.answers.map((response) => ({
                text: response.text ?? '',
                votes: response.voteCount,
            })),
            hash: pollhash,
            duration,
            createdBy: message.author.username,
        });
    }
}
