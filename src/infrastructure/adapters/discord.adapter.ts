import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    GuildScheduledEventEntityType,
    GuildScheduledEventStatus,
    Routes,
    type Client,
    type PermissionOverwriteOptions,
} from 'discord.js';
import type ICommand from '../../types/interfaces/command.interface';
import type IChannelProvider from '../../types/providers/discord/channelProvider.interface';
import type ICommandProvider from '../../types/providers/discord/commandProvider.interface';
import type IInviteProvider from '../../types/providers/discord/inviteProvider.interface';
import type IMemberProvider from '../../types/providers/discord/memberProvider.interface';
import type IRoleProvider from '../../types/providers/discord/roleProvider.interface';
import type IMessageProvider from '../../types/providers/discord/messageProvider.interface';
import {
    ChannelNotFoundError,
    CommandNotFoundError,
    EmptyGuildError,
    EventNotFoundError,
    GuildNotFoundError,
    IncompatibleChannelError,
    InvalidChannelTypeError,
    MessageNotFoundError,
    RoleNotFoundError,
} from '../../types/errors.types';
import type { Channel } from '../../types/channel.types';
import type { Guild } from '../../types/guild.type';
import type IGuildProvider from '../../types/providers/discord/guildProvider.interface';
import type { Attachment } from '../../types/attachment.type';
import type PollMessageDTO from '../../types/dtos/pollMessage.dto';
import type IEventProvider from '../../types/providers/discord/eventProvider.interface';
import type { EventCreateProviderDTO } from '../../types/dtos/eventCreate.dto';
import type { Role } from '../../types/role.type';
import type RoleCreationDTO from '../../types/dtos/roleCreation.dto';
import type IChannelCreationDTO from '../../types/dtos/channelCreation.dto';
import type IThreadProvider from '../../types/providers/discord/threadProvider.interface';
import type { Event } from '../../types/event.type';
import type { Message } from '../../types/message.type';
import type { MessageAction } from '../../types/component.types';

export default class DiscordAdapter
    implements
        ICommandProvider,
        IChannelProvider,
        IInviteProvider,
        IMemberProvider,
        IRoleProvider,
        IMessageProvider,
        IGuildProvider,
        IEventProvider,
        IThreadProvider
{
    constructor(private client: Client) {}

    async countTotalOnlineMembers(): Promise<number> {
        const guilds = await this.client.guilds.fetch();

        if (!guilds) return 0;

        let counter = 0;

        for (const guildValue of guilds.values()) {
            const guild = await this.client.guilds.fetch({ guild: guildValue.id, withCounts: true });

            counter += guild.approximatePresenceCount ?? 0;
        }

        return counter;
    }

    async getMessageById(channelId: string, messageId: string): Promise<Message> {
        const channel = await this.client.channels.fetch(channelId);

        if (!channel) throw new ChannelNotFoundError(channelId, this.getMessageById.name);

        if (channel.type !== ChannelType.GuildText)
            throw new IncompatibleChannelError(channel.type.toString(), 'some guild channel', this.getMessageById.name);

        const message = await channel.messages.fetch(messageId);

        const guild = { id: message.guild!.id, name: message.guild!.name };

        return {
            id: message.id,
            guild,
            content: message.content,
            channel: { id: channel.id, name: channel.name, guild },
            author: {
                id: message.author.id,
                username: message.author.username,
                discriminator: message.author.discriminator,
                avatarURL: message.author.avatarURL(),
                globalName: message.author.globalName,
            },
            createdAt: message.createdAt,
        };
    }

    async getEventStatus(event: Event<true>): Promise<'active' | 'completed' | 'canceled' | 'scheduled'> {
        const guild = await this.client.guilds.fetch(event.guildId);

        if (!guild) throw new GuildNotFoundError(event.guildId, this.setEventStatus.name);

        const guildEvent = await guild.scheduledEvents.fetch(event.id);

        if (!guildEvent) throw new EventNotFoundError(event.id, this.setEventStatus.name);

        switch (guildEvent.status) {
            case GuildScheduledEventStatus.Scheduled:
                return 'scheduled';
            case GuildScheduledEventStatus.Active:
                return 'active';
            case GuildScheduledEventStatus.Completed:
                return 'completed';
            case GuildScheduledEventStatus.Canceled:
                return 'canceled';
        }
    }

    async setEventStatus(event: Event<true>, status: 'active' | 'completed' | 'canceled'): Promise<void> {
        const guild = await this.client.guilds.fetch(event.guildId);

        if (!guild) throw new GuildNotFoundError(event.guildId, this.setEventStatus.name);

        const guildEvent = await guild.scheduledEvents.fetch(event.id);

        if (!guildEvent) throw new EventNotFoundError(event.id, this.setEventStatus.name);

        const statusTypes = {
            active: GuildScheduledEventStatus.Active,
            completed: GuildScheduledEventStatus.Completed,
            canceled: GuildScheduledEventStatus.Canceled,
        } as const;

        await guildEvent.setStatus(statusTypes[status]);
    }

    async getChannelsByName(guildId: string, channelName: string): Promise<Channel[]> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.getChannelsByName.name);

        const channels = await guild.channels.fetch();

        if (!channels) throw new EmptyGuildError(guild.name);

        return channels
            .filter((channel) => channel!.name === channelName)
            .map((channel) => ({
                name: channel!.name,
                id: channel!.id,
                guild: { id: guild.id, name: guild.name },
                parent: channel!.parent ? { id: channel!.parent.id, name: channel!.parent.name } : undefined,
            }));
    }

    async createEvent(dto: EventCreateProviderDTO): Promise<string> {
        const guild = await this.client.guilds.fetch(dto.guildId);

        if (!guild) throw new GuildNotFoundError(dto.guildId, this.createEvent.name);

        const basePayload = {
            name: dto.name,
            description: dto.description,
            image: dto.image ?? null,
            privacyLevel: 2,
            entityType: dto.entityType as unknown as GuildScheduledEventEntityType,
            scheduledStartTime: dto.scheduledStartTime,
            scheduledEndTime: dto.scheduledEndTime,
        };

        if (dto.channelId) {
            const event = await guild.scheduledEvents.create({
                ...basePayload,
                channel: dto.channelId,
            });
            return event.id;
        }

        const event = await guild.scheduledEvents.create({
            ...basePayload,
            entityMetadata: { location: dto.link! },
        });

        return event.id;
    }

    async removeEvent(guildId: string, eventId: string): Promise<void> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.removeEvent.name);

        await guild.scheduledEvents.delete(eventId);
    }

    async editMessage(channelId: string, messageId: string, content: string): Promise<void> {
        const targetChannel = await this.client.channels.fetch(channelId);

        if (!targetChannel) throw new ChannelNotFoundError(channelId, this.editMessage.name);

        if (!targetChannel.isTextBased())
            throw new IncompatibleChannelError(
                targetChannel.type.toString(),
                'some TextChannel',
                this.editMessage.name,
            );

        const message = await targetChannel.messages.fetch(messageId);

        await message.edit(content);
    }

    async removeRole(guildId: string, roleId: string): Promise<void> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.removeRole.name);

        await guild?.roles.delete(roleId);
    }

    async getChannelsByGuildId(guildId: string): Promise<Channel[]> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.getChannelsByGuildId.name);

        const channels = await guild.channels.fetch();

        if (channels.values().toArray().length === 0) return [];

        return channels
            .values()
            .toArray()
            .map((channel) => ({
                id: channel!.id,
                name: channel!.name,
                guild: { id: guild.id, name: guild.name },
                parent: channel!.parent ? { name: channel!.parent.name, id: channel!.parent.id } : undefined,
            }));
    }

    private mapStyle(style?: string): ButtonStyle {
        switch (style) {
            case 'primary':
                return ButtonStyle.Primary;
            case 'success':
                return ButtonStyle.Success;
            case 'danger':
                return ButtonStyle.Danger;
            default:
                return ButtonStyle.Secondary;
        }
    }

    // eslint-disable-next-line complexity
    async sendMessage(
        target: Channel,
        content: string,
        options?: {
            attachment?: Attachment[];
            actions?: MessageAction[];
            replyTo: string;
        },
    ): Promise<string> {
        const channel = await this.client.channels.fetch(target.id);

        if (!channel) throw new Error(`Canal ou Thread com ID ${target.id} não foi encontrado.`);

        if (!channel.isSendable()) {
            throw new Error(`O canal ${target.id} (${channel.constructor.name}) não aceita envio de mensagens.`);
        }

        const payload: any = { content };

        if (options?.attachment && options.attachment.length > 0) {
            payload.files = options.attachment.map((file) => {
                if (Buffer.isBuffer(file) || typeof file === 'string') {
                    return file;
                }

                if (typeof file === 'object' && file !== null) {
                    if ('attachment' in file || 'file' in file) {
                        return file;
                    }

                    if ('url' in file && 'name' in file) {
                        return {
                            attachment: file.url,
                            name: file.name,
                        };
                    }
                }

                return file;
            });
        }

        if (options?.actions && options.actions.length > 0) {
            const row = new ActionRowBuilder<ButtonBuilder>();

            for (const action of options.actions) {
                if (action.type === 'link') {
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel(action.label)
                            .setURL(action.url)
                            .setStyle(ButtonStyle.Link)
                            .setDisabled(action.disabled ?? false),
                    );
                } else if (action.type === 'button') {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(action.customId)
                            .setLabel(action.label)
                            .setStyle(this.mapStyle(action.style))
                            .setDisabled(action.disabled ?? false),
                    );
                }
            }

            payload.components = [row.toJSON()];
        }

        if (options?.replyTo) {
            // For some reason discordjs throw an error instead of null or undefined
            try {
                const replyMessage = await channel.messages.fetch(options.replyTo);

                const message = await replyMessage.reply(payload);
                return message.id;
            } catch {
                throw new MessageNotFoundError(options.replyTo, channel.id, this.sendMessage.name);
            }
        }

        const message = await channel.send(payload);
        return message.id;
    }

    async deleteMessage(channelId: string, messageId: string): Promise<void> {
        const targetChannel = await this.client.channels.fetch(channelId);

        if (!targetChannel) throw new ChannelNotFoundError(channelId, this.deleteMessage.name);

        if (!targetChannel.isTextBased())
            throw new IncompatibleChannelError(
                targetChannel.type.toString(),
                'some TextBasedChannel',
                this.deleteMessage.name,
            );

        await targetChannel.messages.delete(messageId);
    }

    async registerCommand(command: ICommand | ICommand[]): Promise<void> {
        if (command instanceof Array) {
            for (const cmd of command) {
                this.client.application?.commands.create(cmd.build());
            }
            return;
        }

        this.client.application?.commands.create(command.build());
    }

    async deleteCommand(commandName: string): Promise<void> {
        const clientCommands = await this.client.application?.commands.fetch();

        const command = clientCommands?.find((command) => command.name === commandName);

        if (!command) throw new CommandNotFoundError(commandName, 'exclusion');

        await this.client.application?.commands.delete(command.id);
    }

    async updateCommand(command: ICommand): Promise<void> {
        await this.client.application?.commands.create(command.build());
    }

    async clearCommands(): Promise<void> {
        await this.client.application?.commands.set([]);
    }

    async createChannel(channelCreationDTO: IChannelCreationDTO): Promise<Channel> {
        const guild = await this.client.guilds.fetch(channelCreationDTO.guildId);

        if (!guild) throw new GuildNotFoundError(channelCreationDTO.guildId, this.createChannel.name);

        const CHANNEL_TYPE_MAP = {
            text: ChannelType.GuildText,
            voice: ChannelType.GuildVoice,
            category: ChannelType.GuildCategory,
            forum: ChannelType.GuildForum,
            stage: ChannelType.GuildStageVoice,
        } as const;

        const channelType = CHANNEL_TYPE_MAP[channelCreationDTO.type];

        if (channelType === undefined)
            throw new InvalidChannelTypeError(channelCreationDTO.type, this.createChannel.name);

        const channel = await guild.channels.create({
            name: channelCreationDTO.name,
            type: channelType,
            permissionOverwrites: channelCreationDTO.permissions,
            ...(channelCreationDTO.permissions && { permissionOverwrites: channelCreationDTO.permissions }),
            ...(channelCreationDTO.position !== undefined && { position: channelCreationDTO.position }),
            parent: channelCreationDTO.parentId,
        });

        return { name: channel.name, id: channel.id, guild: { id: guild.id, name: guild.name } };
    }

    async deleteChannel(channelId: string): Promise<void> {
        (await this.client.channels.fetch(channelId))?.delete();
    }

    async createInvite(
        maxAge: number,
        maxUses: number,
        channelId: string,
        guaranteedRoleId?: string,
        options?: {
            temporary?: boolean;
            unique?: boolean;
            reason?: string;
        },
    ): Promise<string> {
        const { temporary = false, unique = true, reason } = options ?? {};

        const payload = {
            temporary,
            max_age: maxAge,
            max_uses: maxUses,
            unique,
            ...(guaranteedRoleId && { role_ids: [guaranteedRoleId] }),
        };

        const invite: any = await this.client.rest.post(Routes.channelInvites(channelId), {
            body: payload,
            passThroughBody: false,
            reason,
        });

        return invite.code ? `https://discord.gg/${invite.code}` : invite;
    }

    async listMembers(guildId: string): Promise<{ username: string; id: string }[]> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.listMembers.name);

        return guild.members.cache.map((member) => ({ username: member.user.username, id: member.user.id }));
    }

    async createRole(dto: RoleCreationDTO): Promise<Role> {
        const guild = await this.client.guilds.fetch(dto.guildId);

        if (!guild) throw new GuildNotFoundError(dto.guildId, this.createRole.name);

        return await guild.roles.create({
            name: dto.roleName,
            hoist: dto.hoist,
            mentionable: dto.mentionable,
            colors: { primaryColor: dto.color },
            permissions: dto.permissions,
        });
    }

    async deleteRole(guildId: string, roleId: string): Promise<void> {
        const guild = await this.client.guilds.fetch(guildId);
        if (!guild) throw new GuildNotFoundError(guildId, this.deleteRole.name);

        const role = guild.roles.cache.get(roleId);
        if (!role) throw new RoleNotFoundError(roleId, this.deleteRole.name);

        await role.delete();
    }

    getAllGuilds(): Map<string, Guild> {
        const guilds = new Map();
        for (const guild of this.client.guilds.cache.values()) {
            guilds.set(guild.id, { id: guild.id, name: guild.name });
        }

        return guilds;
    }

    async createPoll(poll: PollMessageDTO, channel: Channel): Promise<void> {
        const targetChannel = await this.client.channels.fetch(channel.id);

        if (!targetChannel) throw new ChannelNotFoundError(channel.name, this.createPoll.name);

        if (!targetChannel.isSendable())
            throw new IncompatibleChannelError(
                targetChannel.type.toString(),
                'some sendable channel',
                this.createPoll.name,
            );

        await targetChannel.send({
            poll: {
                question: { text: poll.question },
                answers: poll.answers,
                duration: poll.duration,
                allowMultiselect: poll.allowMultiSelect,
            },
        });
    }

    async getRoleIdByName(guildId: string, roleName: string): Promise<string> {
        const guild = await this.client.guilds.fetch(guildId);
        if (!guild) throw new GuildNotFoundError(guildId, this.getRoleIdByName.name);

        let role = guild.roles.cache.find((role) => role.name === roleName);

        if (!role) {
            const roles = await guild.roles.fetch();
            role = roles.find((role) => role.name === roleName);
        }

        if (!role) throw new RoleNotFoundError(roleName, this.getRoleIdByName.name);

        return role.id;
    }

    async createThread(channelId: string, threadName: string, message: string): Promise<string> {
        const channel = await this.client.channels.fetch(channelId);

        if (!channel) throw new ChannelNotFoundError(channelId, this.createThread.name);

        if (!channel.isThreadOnly())
            throw new IncompatibleChannelError(channelId, 'threads/forum', this.createThread.name);

        const thread = await channel.threads.create({
            name: threadName,
            message: { content: message },
        });

        return thread.id;
    }

    async updateChannelPermissions(
        channelId: string,
        roleId: string,
        permissions: PermissionOverwriteOptions,
    ): Promise<void> {
        const channel = await this.client.channels.fetch(channelId);

        if (!channel) throw new ChannelNotFoundError(channelId, this.updateChannelPermissions.name);

        if (channel.isDMBased() || channel.isThread()) {
            throw new IncompatibleChannelError(channelId, 'some guild channel', this.updateChannelPermissions.name);
        }

        await channel.permissionOverwrites.edit(roleId, permissions);
    }

    async listEvents(): Promise<Event<true>[]> {
        const events: Event<true>[] = [];

        const guilds = this.client.guilds.cache.values();

        for (const guild of guilds) {
            const guildEvents = await guild.scheduledEvents.fetch();

            events.push(
                ...guildEvents.map((event) => ({
                    id: event.id,
                    guildId: event.guildId,
                    topic: event.name,
                    description: event.description ?? '',
                    scheduledStart: event.scheduledStartAt!,
                    scheduledEnd: event.scheduledEndAt ?? undefined,
                    url: event.url,
                    location: event.channel
                        ? {
                              guild: { name: event.guild!.name, id: event.guild!.id },
                              name: event.channel.name,
                              id: event.channel.id,
                              parent: event.channel.parent
                                  ? { name: event.channel.parent.name, id: event.channel.parent.id }
                                  : undefined,
                          }
                        : event.entityMetadata!.location!,
                })),
            );
        }

        return events;
    }

    async getChannelByName(guildId: string, channelName: string): Promise<Channel> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.getChannelByName.name);

        const channels = await guild.channels.fetch();

        if (!channels) throw new ChannelNotFoundError(channelName, this.getChannelByName.name);

        const channel = channels.find((channel) => channel!.name === channelName);

        if (!channel) throw new ChannelNotFoundError(channelName, this.getChannelByName.name);

        return { id: channel.id, name: channel.name, guild: { id: guild.id, name: guild.name } };
    }

    async getChannelById(guildId: string, channelId: string): Promise<Channel> {
        const guild = await this.client.guilds.fetch(guildId);

        if (!guild) throw new GuildNotFoundError(guildId, this.getChannelById.name);

        const channel = await guild.channels.fetch(channelId);

        if (!channel) throw new ChannelNotFoundError(channelId, this.getChannelById.name);

        return { id: channel.id, name: channel.name, guild: { id: guild.id, name: guild.name } };
    }
}
