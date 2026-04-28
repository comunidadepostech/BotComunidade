import type { CommandEventDto, ExternalSourceEventDto } from "../../dtos/event.dtos.ts";
import type {IDiscordEventService} from "../../types/discord.interfaces.ts";
import {Client, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel} from "discord.js";
import fs from "fs";

export default class EventsSubService implements IDiscordEventService {
    private background: Buffer<ArrayBuffer> | null = null
    constructor(private client: Client){}

    async create(dto: CommandEventDto | ExternalSourceEventDto): Promise<void> {
        if (dto.source === "external") {
            if (!this.background) {
                this.background = fs.readFileSync("assets/postech.png");
            }

            const guild = await this.client.guilds.fetch(dto.guildId)

            await guild.scheduledEvents.create({
                name: dto.topic,
                scheduledStartTime: dto.startDatetime,
                scheduledEndTime: dto.endDatetime,
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: GuildScheduledEventEntityType.Voice,
                description: dto.description,
                image: this.background,
                channel: dto.channel
            })
            return
        }

        if (dto.source === "command") {
            const guild = await this.client.guilds.fetch(dto.guildId)

            await guild.scheduledEvents.create({
                name: dto.topic,
                scheduledStartTime: dto.startDatetime,
                scheduledEndTime: dto.endDatetime,
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: GuildScheduledEventEntityType.External,
                description: dto.description,
                image: dto.background,
                entityMetadata: {location: dto.link}
            })
        }
    }
    
    async delete(guildId: string, eventId: string): Promise<void> {
        const guild = await this.client.guilds.fetch(guildId)
        try {
            await guild.scheduledEvents.delete(eventId)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido"
            console.error(`Erro ao tentar remover evento (${message}). O evento existe?`)
            //throw new Error(`Erro ao tentar remover evento (${message}). O evento existe?`)
        }
    }

}