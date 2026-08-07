import type { Guild } from './guild.type';

export type Channel = {
    guild: Guild;
    name: string;
    id: string;
    type?: ChannelType;
    parent?: { name: string; id: string };
};

export type ChannelType = 'text' | 'voice' | 'category' | 'forum' | 'stage';
