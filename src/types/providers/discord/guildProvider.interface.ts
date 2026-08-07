import type { Guild } from '../../guild.type';

export default interface IGuildProvider {
    /**
     * Retrieve all available guilds.
     */
    getAllGuilds(): Map<string, Guild>;
}
