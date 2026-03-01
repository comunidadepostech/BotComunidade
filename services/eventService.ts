import eventCreationDTO from "../entities/dto/eventCreationDTO.ts";
import fs from "fs";

const imageBuffer = fs.readFileSync("assets/postech.png");

export default class EventService {
    public static async createEvent(event: eventCreationDTO) {
        if (event.origin === "external") {
            await event.guild!.scheduledEvents.create({
                name: event.class + " - " + event.topic,
                scheduledStartTime: event.startDatetime,
                scheduledEndTime: event.endDatetime,
                privacyLevel: 2, // Guild Only
                entityType: 2, // External
                description: event.description,
                image: imageBuffer,
                channel: event.channel
            })
            return
        }

        if (event.origin === "command") {
            await event.guild!.scheduledEvents.create({
                name: event.class + " - " + event.topic,
                scheduledStartTime: event.startDatetime,
                scheduledEndTime: event.endDatetime,
                privacyLevel: 2, // Guild Only
                entityType: 3, // External
                description: event.description,
                image: event.background,
                entityMetadata: {location: event.link}
            })
            return
        }

        throw new Error("Origem inváida")
    }
}