import DatabaseConnection from "./databaseConnection.ts";
import type { Pool } from "mysql2/promise";

export default class DatabaseCheckRepository {
    constructor(private databaseConnection: DatabaseConnection){}   

    async checkSchemas(): Promise<void> {
        const pool: Pool = this.databaseConnection.getPool();

        await pool.query(`CREATE TABLE IF NOT EXISTS featureFlags (guild_id VARCHAR(22), flags JSON);`)
        await pool.query(`CREATE TABLE IF NOT EXISTS discord_event_warnings (channel_id VARCHAR(19), message_id VARCHAR(19));`)
    }
}