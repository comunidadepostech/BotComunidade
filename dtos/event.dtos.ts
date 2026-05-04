import {VoiceChannel} from "discord.js";

export interface CommandEventDto {
    source: "command"
    startDatetime: Date
    endDatetime: Date
    topic: string
    description: string
    background: string
    link: string
    guildId: string
}

export interface ExternalSourceEventDto {
    source: "external"
    startDatetime: Date
    endDatetime: Date
    topic: string
    description: string
    type: "Grupo de estudos" | "Live" | "Mentoria" | "Hackaton"
    link: string
    guildId: string
    channel: VoiceChannel
}