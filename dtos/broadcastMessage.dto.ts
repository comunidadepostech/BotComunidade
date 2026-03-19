import {Attachment, TextChannel} from "discord.js";

export interface BroadcastMessageDto {
    content: string;
    files: Attachment[];
    targetChannel: TextChannel;
    onlyTargetChannel: boolean;
}