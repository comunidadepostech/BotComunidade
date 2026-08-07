export default interface SavePollMessageDTO {
    guildName: string;
    category: string;
    poll_question: string;
    responses: { text?: string; votes?: number }[];
    hash: string;
    duration: string;
    createdBy: string;
}
