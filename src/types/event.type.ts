import type { Channel } from './channel.types';

export type Event<Active extends boolean = false> = {
    id: string;
    guildId: string;
    topic: string;
    description: string;
    scheduledStart: Date;
    scheduledEnd?: Date;
    location: Channel | string;
    image?: string | Buffer;
} & (Active extends true ? { url: string } : { url?: never });
