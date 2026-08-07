export default interface N8NMessageSaveDTO {
    createdBy: string | 'Unknown User';
    guild: string;
    message: string;
    timestamp: string;
    id: string;
    authorRole: string;
    thread: string | null;
    channel: string | null;
    class: string | null;
}
