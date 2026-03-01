import {Client, Guild} from "discord.js";

export default interface EventCreationDTO {
    startDatetime: Date,
    endDatetime: Date,
    topic: string,
    guild: Guild,
    origin: "command" | "external"
    description: string,
    background: string
    type?: "Grupo de estudos" | "Live" | "Mentoria" | "Hackaton" | "Extra";
    class?: string,
    link?: string,
    client?: Client
}