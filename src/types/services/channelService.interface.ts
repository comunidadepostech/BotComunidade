import type { Channel } from '../channel.types';

export default interface IChannelService {
    /**
     * Retrieve all channels for a specific guild.
     *
     * @param guildId The guild ID
     */
    getAllChannelsByGuildId(guildId: string, options?: { filterByName?: string }): Promise<Channel[]>;
}
