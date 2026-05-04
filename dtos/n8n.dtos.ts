export interface Poll {
    created_by: string;
    guild: string;
    poll_category: string;
    poll_hash: string;
    question: string;
    answers: {response: string, answers: number}[];
    duration: string // horas
}

export interface InteractionPayload {
    createdBy: string;
    guild: string;
    message: string;
    timestamp: string;
    id: string;
    authorRole: string;
    thread: string | null;
    channel: string | null;
    class: string | null;
}