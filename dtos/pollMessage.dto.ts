import {TextChannel} from "discord.js";

export interface PollMessageDto {
    question: {text: string};
    options: { text: string }[];
    allowMultiSelect: boolean;
    channel: TextChannel;
    duration: number;
}