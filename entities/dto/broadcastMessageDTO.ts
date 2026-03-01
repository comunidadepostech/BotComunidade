import {Client, TextChannel} from "discord.js";

export interface BroadcastMessageDTO {
    content: string;
    files: string[];
    targetChannel: TextChannel;
    onlyTargetChannel: boolean;
    client: Client
}