import { CommandEventDto, ExternalSourceEventDto } from "../../dtos/event.dtos.ts";
import {IDiscordEventService} from "../../types/discord.interfaces.ts";
import {Client} from "discord.js";
import fs from "fs";

export default class EventsSubService implements IDiscordEventService {
    private backgroud: Buffer<ArrayBuffer> | null = null
    constructor(private client: Client){}

    async create(dto: CommandEventDto | ExternalSourceEventDto) {
        if (dto.source === "external") {
            if (!this.backgroud) {
                this.backgroud = fs.readFileSync("assets/postech.png");
            }

            const guild = await this.client.guilds.fetch(dto.guildId)

            await guild.scheduledEvents.create({
                name: dto.topic,
                scheduledStartTime: dto.startDatetime,
                scheduledEndTime: dto.endDatetime,
                privacyLevel: 2, // Guild Only
                entityType: 2, // External
                description: dto.description,
                image: this.backgroud,
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
                privacyLevel: 2, // Guild Only
                entityType: 3, // External
                description: dto.description,
                image: dto.background,
                entityMetadata: {location: dto.link}
            })
            return
        }
    }
    async delete(guildId: string, eventId: string): Promise<void | Error> {
        const guild = await this.client.guilds.fetch(guildId)
        try {
            await guild.scheduledEvents.delete(eventId)
        } catch (error: any) {
            console.error("Erro ao tentar remover evento - o evento existe?")
            return error as Error
        }
    }

}