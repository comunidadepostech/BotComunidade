import type {IDiscordClassService} from "../../types/discord.interfaces.ts";
import {
    CategoryChannel,
    ChannelType,
    Client,
    Collection, type ForumChannel,
    Guild, type GuildChannelCreateOptions,
    PermissionFlagsBits,
    Role,
    TextChannel,
    ThreadAutoArchiveDuration
} from "discord.js";

import type {GuildBasedChannel, Channel} from "discord.js";
import type ClassCreationDto from "../../dtos/classCreation.dto.ts";
import {
    ADMIN_PERMISSIONS,
    ADMIN_ROLES,
    CHANNELS_CONFIG, FORUM_TAGS, INITIAL_POSTS,
    STUDENT_PERMISSIONS
} from "../../constants/discordConstants.ts";

export default class ClassSubService implements IDiscordClassService {
    constructor(private client: Client) {}

    private async ensureAdminRoles(guild: Guild): Promise<void> {
        const existingRoles = new Set(guild.roles.cache.map((r: Role) => r.name));

        const rolesToCreate = ADMIN_ROLES.filter((name) => !existingRoles.has(name));

        await Promise.all(rolesToCreate.map((name) => guild.roles.create({ name })));
    }

    private async createClassRole(guild: Guild, className: string): Promise<Role> {
        return await guild.roles.create({
            name: `Estudantes ${className}`,
            color: 3447003,
            mentionable: true,
            hoist: true,
            permissions: STUDENT_PERMISSIONS,
        });
    }

    private async createCategory(
        guild: Guild,
        className: string,
        adminRoles: Collection<string, Role>,
        classRole: Role,
    ): Promise<CategoryChannel> {
        const permissionOverwrites = [
            ...ADMIN_ROLES.map((roleName) => ({
                id: adminRoles.find((r) => r.name === roleName)!.id,
                allow: ADMIN_PERMISSIONS,
                deny: [],
            })),
            {
                id: classRole.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendPolls],
            },
        ];

        return await guild.channels.create({
            name: className,
            type: ChannelType.GuildCategory,
            permissionOverwrites,
        });
    }

    private async createChannels(
        guild: Guild,
        className: string,
        category: CategoryChannel,
        classRole: Role,
    ): Promise<void> {
        const promises = CHANNELS_CONFIG.map(async (config) => {
            const isVoiceChannel =
                config.type === ChannelType.GuildVoice || config.type === ChannelType.GuildStageVoice;
            const channelName = isVoiceChannel ? `${config.name.replace(/^(?:📒|🎙️)│/u, '')} ${className}` : config.name;

            const channelData: GuildChannelCreateOptions  = {
                name: channelName,
                type: config.type,
                parent: category.id,
                position: config.position,
                ...(isVoiceChannel ? {} : { defaultAutoArchiveDuration: ThreadAutoArchiveDuration.OneWeek }),
            };

            const channel = await guild.channels.create(channelData);

            if (config.restrictStudents) {
                await channel.permissionOverwrites.edit(classRole.id, {
                    SendMessages: false
                });
            }

            return channel;
        });

        await Promise.all(promises);
    }

    private async setupForumChannel(
        channels: Collection<string, GuildBasedChannel>,
        category: CategoryChannel,
        classRole: Role,
    ): Promise<void> {
        const forumChannel = channels.find(
            (ch) =>
                ch.name === '❓│dúvidas' &&
                ch.parent?.id === category.id &&
                ch.type === ChannelType.GuildForum,
        ) as ForumChannel;

        if (!forumChannel) return;

        await forumChannel.setAvailableTags(FORUM_TAGS.map((name) => ({ name, moderated: false })));

        await Promise.all(
            INITIAL_POSTS.map((post) =>
                forumChannel.threads.create({
                    name: post.title,
                    message: { content: post.content.replaceAll('{mention}', `${classRole}`) },
                }),
            ),
        );
    }

    private async givePermissionsForDefaultChannels(
        classRole: Role,
        channels: Collection<string, Channel>,
        faqChannelId: string,
    ): Promise<void> {
        const permissionMap = {
            Alun: { ReadMessageHistory: true, SendMessages: true, ViewChannel: true, CreatePublicThreads: true },
            'Pós Tech': {
                ReadMessageHistory: true,
                SendMessages: false,
                ViewChannel: true,
                CreatePublicThreads: false,
            },
        };

        for (const channel of channels.values()) {
            if (channel.type === ChannelType.GuildCategory) {
                const permissions = permissionMap[channel.name as keyof typeof permissionMap];
                if (permissions) {
                    await channel.permissionOverwrites.edit(classRole, permissions);
                }
            } else if (channel.id === faqChannelId && channel.type === ChannelType.GuildText) {
                await (channel as TextChannel).permissionOverwrites.edit(classRole, {
                    ReadMessageHistory: true,
                    SendMessages: false,
                    ViewChannel: true,
                    CreatePublicThreads: true,
                });
            }
        }
    }

    async create(dto: ClassCreationDto): Promise<{role: Role, message: string}> {
        const guild = await this.client.guilds.fetch(dto.guildId)

        if (!guild) throw new Error(`Guilda não encontrada ao tentar criar a turma ${dto.className}`)

        // 1. Criar/atualizar roles admin
        await this.ensureAdminRoles(guild);

        // 2. Criar cargo da turma
        const classRole = await this.createClassRole(guild, dto.className);

        // 3. Dar permissões em canais padrão
        const channels = guild.channels.cache;
        await this.givePermissionsForDefaultChannels(classRole, channels, dto.faqChannelId);

        // 4. Criar categoria da turma
        const adminRoles = guild.roles.cache.filter((role) =>
            ADMIN_ROLES.includes(role.name),
        );
        const classCategory = await this.createCategory(guild, dto.className, adminRoles, classRole);

        // 5. Criar canais da turma
        await this.createChannels(guild, dto.className, classCategory, classRole);

        // 6. Adicionar posts e tags no forum
        await this.setupForumChannel(channels, classCategory, classRole);

        return {
            role: classRole,
            message: `✅ Turma ${dto.className} criado com sucesso!\n👥 Cargo vinculado: ${classRole}`, // Link do convite: ${invite.url}
        };
    }

    async disable(role: Role): Promise<void> {
        await role.delete().catch((error) => {
            const message = error instanceof Error ? error.message : "Erro desconhecido"
            throw new Error(`Eu não tenho permissão para desabilitar essa turma, verifique se meu cargo está acima do cargo que você está tentando desabilitar\nErro detalhado: ${message}`)
        })
    }
}