import type { ChannelType } from "../channel.types";

export default interface IChannelCreationDTO {
    guildId: string;
    name: string;
    type: ChannelType;
    position?: number;
    parentId?: string;
    permissions?: any;
}