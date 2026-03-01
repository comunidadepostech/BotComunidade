import {Client, Guild, VoiceBasedChannel} from "discord.js";

export default interface EventCreationDTO {
    startDatetime: Date,
    endDatetime: Date;
    topic: string;
    guild: Guild;
    origin: "command" | "external";
    description: string;
    background?: string;
    type?: "Grupo de estudos" | "Live" | "Mentoria" | "Hackaton";
    class?: string;
    link?: string;
    client?: Client;
    channel?: VoiceBasedChannel;
}