export default interface IClassService {
    /**
     * Create the role, channels, category and the invite for a new class
     * 
     * @param guildId Id of the guild
     * @param className The name of the class (Example: 9ADJT)
     * @param faqChannelId Id of the FAQ channel used by this class
     * 
     * @returns The invite URL for the class
     */
    createClass(guildId: string, className: string, faqChannelId: string): Promise<string>;

    /**
     * Delete the role of the class so they can't see the channels anymore
     * 
     * @param guildId Id of the guild
     * @param className The name of the class (Example: 9ADJT)
     */
    deleteClass(guildId: string, className: string): Promise<void>;
}