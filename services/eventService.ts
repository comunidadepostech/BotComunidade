import eventCreationDTO from "../entities/dto/eventCreationDTO.ts";

export default class EventService {
    public static async createEvent(event: eventCreationDTO) {
        if (event.origin === "external") {
            client

            await event.guild!.scheduledEvents.create({
                name: event.topic,
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

        if (event.origin === "command") {
            await event.guild!.scheduledEvents.create({
                name: event.topic,
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