
import type { RowDataPacket } from "mysql2";
import type DatabaseConnection from "./databaseConnection";

export default class DatabaseGuildsRepository {
    private guilds: Map<string, string>
    constructor(private databaseConnection: DatabaseConnection) {
        this.guilds = new Map<string, string>()
    }

    async syncGuilds(): Promise<void> {
        const pool = this.databaseConnection.getPool();

        const [rows] = await pool.execute<RowDataPacket[]>("SELECT guild_name, guild_id FROM guilds")
        
        this.guilds.clear();
        for (const row of rows) {
            this.guilds.set(row["guild_name"], row["guild_id"]);
            this.guilds.set(row["guild_id"], row["guild_name"]);
        }

        console.debug(`Guilds sincronizadas: ${this.guilds.size}`);
    }

    getGuildIdByCourse(course: string): string | undefined {
        return this.guilds.get(course);
    }

    getGuildCourseById(guildId: string): string | undefined {
        return this.guilds.get(guildId);
    }
}