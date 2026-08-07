import type { PermissionOverwriteOptions } from 'discord.js'; // The object is too big to replicate

import type { Channel } from '../../channel.types';
import type IChannelCreationDTO from '../../dtos/channelCreation.dto';

export default interface IChannelProvider {
    /**
     * Get a list of channels in the specified guild.
     *
     * @param guildId Id of the guild
     */
    getChannelsByGuildId(guildId: string): Promise<Channel[]>;

    /**
     * Create a new channel in a guild.
     *
     * @param channelCreationDTO The data transfer object for channel creation
     */
    createChannel(channelCreationDTO: IChannelCreationDTO): Promise<Channel>;

    /**
     * Update channel permissions for a specific role.
     *
     * @param channelId Id of the channel
     * @param roleId Id of the role
     * @param permissions Permission overwrite options
     */
    updateChannelPermissions(channelId: string, roleId: string, permissions: PermissionOverwriteOptions): Promise<void>;

    /**
     * Get a channel by its ID within the guild.
     *
     * @param guildId Id of the guild
     * @param channelId Id of the channel
     */
    getChannelById(guildId: string, channelId: string): Promise<Channel>;

    /**
     * Return the first channel that matches the name in the guild.
     *
     * @param guildId Id of the guild
     * @param channelName The name of the channel
     */
    getChannelByName(guildId: string, channelName: string): Promise<Channel>;

    /**
     * Return all channels that match the name in the guild.
     *
     * @param guildId Id of the guild
     * @param channelName The name of the channel
     */
    getChannelsByName(guildId: string, channelName: string): Promise<Channel[]>;
}
