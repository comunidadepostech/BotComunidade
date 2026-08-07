import type { Channel } from '../types/channel.types';
import type IChannelProvider from '../types/providers/discord/channelProvider.interface';
import type IChannelService from '../types/services/channelService.interface';

export default class ChannelService implements IChannelService {
    constructor(private channelProvider: IChannelProvider){}
    
    async getAllChannelsByGuildId(guildId: string, options?: { filterByName?: string }): Promise<Channel[]> {
        const channels = await this.channelProvider.getChannelsByGuildId(guildId);

        if (options?.filterByName) {
            return channels.filter(channel => channel.name.includes(options.filterByName!));
        }

        return channels;
    }
}
