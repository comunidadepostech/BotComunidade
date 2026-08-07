export default interface RepositoryMessageSaveDTO {
    message_id: string;
    guild_name: string;
    category: string | null;
    role_name: string;
    user_name: string;
    channel_name: string;
    message: string;
    thread_name: string | null;
}
