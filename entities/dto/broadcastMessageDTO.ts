import {Client, TextChannel} from "discord.js";

export interface BroadcastMessageDTO {
    content: string;
    files: { attachment: string; name: string }[];
    targetChannel: TextChannel;
    onlyTargetChannel: boolean;
    client: Client
}