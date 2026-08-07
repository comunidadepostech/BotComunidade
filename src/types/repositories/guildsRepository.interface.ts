export default interface IGuildsRepository {
    /**
     * Get the guild ID for the specified course.
     *
     * @param course The course name
     */
    getGuildIdByCourse(course: string): Promise<{ guild_id: string } | null>;

    /**
     * Get the course name for the specified guild.
     *
     * @param guildId The guild ID
     */
    getGuildCourseById(guildId: string): Promise<{ guild_name: string } | null>;

    /**
     * Add a guild record with the provided name and cluster data.
     *
     * @param guildId The guild ID
     * @param guildName The guild name
     * @param clusters The associated cluster string
     */
    addGuild(guildId: string, guildName: string, clusters: string): Promise<void>;

    /**
     * Get guild IDs that belong to a specific cluster.
     *
     * @param cluster The cluster identifier
     */
    getGuildIdsByCluster(cluster: string): Promise<string[]>;

    /**
     * Retrieve all registered guilds.
     */
    getAllGuilds(): Promise<{ guild_id: string; guild_name: string; clusters: string | null }[]>;
}
