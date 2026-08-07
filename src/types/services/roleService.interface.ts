export default interface IRoleService {
    /**
     * Retrieve the ID of a role by its name in a guild.
     *
     * @param guildId The guild ID
     * @param name The role name
     */
    getRoleIdByName(guildId: string, name: string): Promise<string>;
}
