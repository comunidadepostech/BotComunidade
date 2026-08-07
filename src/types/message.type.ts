import type { Author } from "./author.type";
import type { Channel } from "./channel.types";
import type { Guild } from "./guild.type";

export type Message = {
    id: string;
    guild: Guild;
    channel: Channel;
    content: string;
    author: Author;
    createdAt: Date;
    attachment?: string[] | Buffer[];
};