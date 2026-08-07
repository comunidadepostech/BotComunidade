export default interface IMembersRepository {
    /**
     * Save the total number of members for a class in a guild.
     *
     * @param className The class name
     * @param total The total number of members
     * @param guild_name The guild name
     */
    saveTotalMembers(className: string, total: number, guild_name: string): Promise<void>;

    /**
     * Save the current number of online members.
     *
     * @param total The number of online members
     */
    saveOnlineMembers(total: number): Promise<void>;
}
