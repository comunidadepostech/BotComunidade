import DatabaseConnection from "./databaseConnection.ts";

export default class DatabaseCheckRepository {
    public static async checkSchemas(): Promise<void> {
        const pool = DatabaseConnection.getPool();

        await pool.query(`CREATE TABLE IF NOT EXISTS featureFlags (guild_id VARCHAR(22), flags JSON);`)
        await pool.query(`CREATE TABLE IF NOT EXISTS guilds (guild_nomenclature VARCHAR(10), guild_id VARCHAR(22));`)
    }
}