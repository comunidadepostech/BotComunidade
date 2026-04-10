import type DatabaseConnection from "./databaseConnection.ts";
import type {IDatabaseWarningRepository, WarningMessageRow} from "../../types/database.interfaces.ts";

export default class DatabaseWarningRepository implements IDatabaseWarningRepository {
    constructor(private databaseConnection: DatabaseConnection) {}

    async save(message_id: string, channel_id: string): Promise<void> {
        const pool = this.databaseConnection.getPool()

        await pool.execute("INSERT INTO discord_event_warnings VALUES (channel_id, message_id) = ?, ?", [channel_id, message_id])
    }

    delete(): void {
        const pool = this.databaseConnection.getPool()

        pool.execute("TRUNCATE TABLE discord_event_warnings")
    }

    async check(channel_id?: string): Promise<WarningMessageRow | WarningMessageRow[] | undefined> {
        const pool = this.databaseConnection.getPool()

        if (channel_id) {
            const [rows] = await pool.execute<WarningMessageRow[]>("SELECT message_id FROM discord_event_warnings WHERE channel_id = ?", [channel_id])
            return rows[0]
        } else {
            const [rows] = await pool.execute<WarningMessageRow[]>("SELECT * FROM discord_event_warnings")
            return rows
        }
    }
}