import type { entityType } from '../entityType.enum';

type CommonEventData = {
    name: string;
    description: string;
    image?: Buffer | null;
    entityType: entityType;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
};

type VoiceEventFields = CommonEventData & { channelId: string; link?: never };
type ExternalEventFields = CommonEventData & { channelId?: never; link: string };
type EventPayload = VoiceEventFields | ExternalEventFields;

export type EventCreateServiceDTO = EventPayload & {
    guilds: string[]
};

export type EventCreateProviderDTO = EventPayload & {
    guildId: string;
};
