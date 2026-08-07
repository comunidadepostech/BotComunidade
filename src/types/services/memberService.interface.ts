export default interface IMemberService {
    /**
     * Save the current number of online members.
     *
     * @param total The number of online members
     */
    saveOnlineMembers(total: number): Promise<void>;

    /**
     * Save the total number of members for a class.
     *
     * @param className The class name
     * @param guildName The guild name
     * @param total The total number of members
     */
    saveTotalMembers(className: string, guildName: string, total: number): Promise<void>;
}
