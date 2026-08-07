import type { Channel } from "./channel.types";

export type Thread = {
    id: string;
    title: string;
    parent: Channel;
}