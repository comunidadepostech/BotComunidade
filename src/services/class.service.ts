import type { ChannelType } from '../types/channel.types';
import { ChannelNotFoundError } from '../types/errors.types';
import type IChannelProvider from '../types/providers/discord/channelProvider.interface';
import type IInviteProvider from '../types/providers/discord/inviteProvider.interface';
import type IRoleProvider from '../types/providers/discord/roleProvider.interface';
import type IThreadProvider from '../types/providers/discord/threadProvider.interface';
import type IClassService from '../types/services/classService.interface';
import {
    CLASS_CHANNELS,
    INITIAL_FORUM_POSTS,
    PROFESSOR_CHANNEL_PERMISSIONS,
    PROFESSOR_ROLE_NAMES,
    QUESTIONS_CHANNEL_NAME,
    ROLE_NAME_REPLACEMENT,
    STUDENT_ROLE_PERMISSIONS,
    STUDENTS_NORMAL_CHANNEL_PERMISSIONS,
    STUDENTS_STRICT_CHANNEL_PERMISSIONS,
    WELCOME_CHANNEL_NAME,
} from '../utils/constants/discordConstants';

export default class ClassService implements IClassService {
    constructor(
        private roleProvider: IRoleProvider,
        private channelProvider: IChannelProvider,
        private threadProvider: IThreadProvider,
        private inviteProvider: IInviteProvider,
    ) {}

    async createClass(guildId: string, className: string, faqChannelId: string): Promise<string> {
        // Create a class role in the guild
        const classRole = await this.roleProvider.createRole({
            guildId,
            roleName: `Estudantes ${className}`,
            color: 3447003,
            hoist: true,
            mentionable: true,
            permissions: STUDENT_ROLE_PERMISSIONS,
        });

        // Give permissions to view the default server channels and the specific FAQ channel
        await this.channelProvider.updateChannelPermissions(faqChannelId, classRole.id, {
            ViewChannel: true,
            SendMessages: false,
            SendPolls: false,
        });

        await this.channelProvider.updateChannelPermissions(
            (await this.channelProvider.getChannelByName(guildId, 'Pós Tech')).id,
            classRole.id,
            {
                ViewChannel: true,
                SendMessages: false,
                SendPolls: false,
            },
        );

        await this.channelProvider.updateChannelPermissions(
            (await this.channelProvider.getChannelByName(guildId, 'Alun')).id,
            classRole.id,
            {
                ViewChannel: true,
                SendMessages: true,
                SendPolls: false,
            },
        );

        // Create the category for the class
        const permissions = await Promise.all(
            PROFESSOR_ROLE_NAMES.map(async (roleName) => ({
                id: await this.roleProvider.getRoleIdByName(guildId, roleName),
                ...PROFESSOR_CHANNEL_PERMISSIONS,
            })),
        );

        const category = await this.channelProvider.createChannel({
            guildId,
            name: className,
            type: 'category',
            permissions: [
                ...permissions,
                {
                    id: classRole.id,
                    ...STUDENTS_NORMAL_CHANNEL_PERMISSIONS,
                },
            ],
        });

        // Create the channels for the class
        const createdChannels = [];
        for (const channel of CLASS_CHANNELS) {
            const created = await this.channelProvider.createChannel({
                guildId: guildId,
                name: channel.name.replace(ROLE_NAME_REPLACEMENT, className),
                type: channel.type as ChannelType,
                parentId: category.id,
                position: channel.position,
                permissions: channel.restrictStudents
                    ? [
                          ...permissions,
                          {
                              id: classRole.id,
                              ...STUDENTS_STRICT_CHANNEL_PERMISSIONS,
                          },
                      ]
                    : null,
            });
            createdChannels.push(created);
        }

        // Create the default threads
        const questionsChannel = createdChannels.find((channel) => channel.name === QUESTIONS_CHANNEL_NAME);

        if (!questionsChannel) {
            throw new ChannelNotFoundError(QUESTIONS_CHANNEL_NAME, this.createClass.name);
        }

        for (const thread of INITIAL_FORUM_POSTS)
            await this.threadProvider.createThread(
                questionsChannel.id,
                thread.title,
                thread.content.replaceAll('{mention}', `<@&${classRole.id}>`),
            );

        // Create invite
        const welcomeChannel = await this.channelProvider.getChannelByName(guildId, WELCOME_CHANNEL_NAME);

        return await this.inviteProvider.createInvite(0, 0, welcomeChannel.id, classRole.id, {
            temporary: false,
            unique: true,
        });
    }

    async deleteClass(guildId: string, className: string): Promise<void> {
        // Implement the logic to delete a class in the guild
        console.log(`Deleting class ${className} from guild ${guildId}`);
    }
}
