export default interface IMemberProvider {
    /**
     * List members of a guild with either usernames or IDs.
     *
     * @param guildId The ID of the guild
     * @param returnType Whether to return member usernames or IDs
     */
    listMembers(guildId: string, returnType: 'usernames' | 'ids'): Promise<{ username: string; id: string }[]>;
}
