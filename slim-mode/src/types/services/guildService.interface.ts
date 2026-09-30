export default interface IGuildService {
    /**
     * Synchronize guild records with the source of truth.
     */
    syncGuilds(): Promise<void>;

    /**
     * Get the cluster identifier for a guild.
     *
     * @param guildId The guild ID
     */
    getClustersByGuildId(guildId: string): Promise<string | null | undefined>;

    /**
     * Get the guild IDs associated with a cluster.
     *
     * @param cluster The target cluster
     */
    getGuildIdsByClusters(cluster: string[]): Promise<string[]>;

    /**
     * Save a new guild entry.
     *
     * @param guildId The guild ID
     */
    saveNewGuild(guildId: string): Promise<void>;

    /**
     * Save the guilds that are not stored yet (with empty course name and clusters).
     *
     * @param guildIds The IDs of every guild the bot is currently in
     * @returns The IDs of the guilds that were saved
     */
    registerMissingGuilds(guildIds: string[]): Promise<string[]>;

    /**
     * Get the guild ID associated with a course name.
     *
     * @param courseName The course name
     */
    getGuildIdByCourseName(courseName: string): Promise<string>;
}
