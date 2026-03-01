import {TextChannel} from "discord.js";

export interface PollMessageDTO {
    question: {text: string};
    options: { text: string }[];
    allowMultiSelect: boolean;
    channel: TextChannel;
    duration: number;
}