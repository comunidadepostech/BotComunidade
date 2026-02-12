export interface EventData {
    guildName: string;
    maxParticipants: number;
    startedAt: StartTimestamp | null;
    endedAt: EndTimestamp | null;
    class: string;
}

export type StartTimestamp = number
export type EndTimestamp = number