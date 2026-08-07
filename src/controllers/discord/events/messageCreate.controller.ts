import { ChannelType, ForumChannel, Message } from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';
import type IFeatureFlagsService from '../../../types/services/featureFlagsService.interface';
import type IMessageService from '../../../types/services/messageService.interface';
import type { Guild } from '../../../types/guild.type';

export default class MessageCreateEventController implements IController {
    constructor(
        private logger: ILoggerService,
        private flagService: IFeatureFlagsService,
        private messageService: IMessageService,
    ) {}

    async handle(message: Message): Promise<void> {
        // Ignore system messages, empty messages, messages that are only mentions, and messages from bots
        if (
            message.author.system ||
            !message.content?.trim() ||
            message.content.match(/^<@!?\d+>$/) ||
            !message.guild ||
            ![
                ChannelType.GuildText,
                ChannelType.PublicThread,
                ChannelType.GuildStageVoice,
                ChannelType.GuildVoice,
            ].includes(message.channel.type) ||
            !this.flagService.isEnabled(message.guild!.id, 'salvar_interacoes')
        ) {
            return;
        }

        // Fetch the channel to ensure we have the latest data and check if it's a DM channel
        const channel = await message.channel.fetch();
        if (!channel || channel.isDMBased()) return;

        // Check if the channel has a parent (category) and return if it doesn't
        if (!channel.parent) {
            this.logger.warn(
                "Message not saved because it doesn't has a parent, ensure all the channels in the guild has a parent (category)",
                {
                    guildId: message.guildId,
                    messageId: message.id,
                    content: message.content.slice(0, 50),
                    channel: channel.name,
                },
            );
            return;
        }

        const member = await message.guild!.members.fetch(message.author.id);
        const roles = member.roles.cache.filter((role) => role.id !== message.guild!.id);
        const sortedRoles = roles.sort((role1, role2) => role2.position - role1.position);

        const firstRole = sortedRoles.first();
        if (!firstRole) {
            this.logger.warn(`No roles found for user in guild ${message.guild!.name}, interaction ignored`, {
                guildId: message.guild!.id,
                userId: message.author.id,
                username: message.author.username,
                messageContent: message.content.slice(0, 50), // Log only the first 50 characters of the message
            });
            return;
        }

        const isNormalChannel = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(
            message.channel.type,
        );

        const thread = isNormalChannel ? null : channel.name;
        const category = isNormalChannel
            ? channel.parent.name
            : ((await message.guild!.channels.fetch(channel.parent.id)) as ForumChannel).parent!.name;
        const localTime = new Date(message.createdTimestamp).toISOString();
        const { guild, id, content } = message;
        const guildData: Guild = { id: guild!.id, name: guild!.name };
        const ch = isNormalChannel
            ? { id: channel.id, name: channel.name, guild: guildData }
            : { id: channel.parent.id, name: channel.parent.name, guild: guildData };

        await this.messageService.saveMessage({
            threadName: thread,
            message: {
                id,
                content,
                guild: guildData,
                channel: ch,
                author: {
                    id: message.author.id,
                    username: message.author.username,
                    globalName: message.author.globalName,
                    discriminator: message.author.discriminator,
                    avatarURL: message.author.avatarURL(),
                },
                createdAt: new Date(localTime),
            },
            category,
            role: {
                id: firstRole.id,
                name: firstRole.name,
                guild: guildData,
            },
        });
    }
}
