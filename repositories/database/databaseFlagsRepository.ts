import DatabaseConnection from "./databaseConnection.ts"
import {Flag, globalFlags, GuildFlags} from "../../entities/discordEntities.ts"
import {DEFAULT_FEATURE_FLAGS} from "../../constants/flagsConstants.ts";
import {RowDataPacket} from "mysql2/promise";

export default class DatabaseFlagsRepository {
    public static async getGuildFeatureFlags(guildId: string): Promise<GuildFlags | null> {
        const pool = DatabaseConnection.getPool();
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM featureFlags WHERE guild_id = ?`, [guildId]);

        for (const row of rows) {
            if (row.guild_id === guildId) return row.flags
        }

        return null
    }

    public static async getAllFeatureFlags(): Promise<globalFlags> {
        const pool = DatabaseConnection.getPool();
        let [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM featureFlags`);

        let flags: { [key: string]: GuildFlags } = {}

        for (const row of rows) {
            flags[row.guild_id] = row.flags
        }

        return flags
    }

    public static async updateFeatureFlag(guildId: string, flag: string, value: boolean) {
        const pool = DatabaseConnection.getPool();
        const databaseFeatureFlags = await this.getGuildFeatureFlags(guildId)

        if (!databaseFeatureFlags) return new Error(`Feature flag '${flag}' não encontrada no banco de dados`)

        databaseFeatureFlags[flag] = value

        await pool.query(
            `UPDATE featureFlags SET flags = ? WHERE guild_id = ?;`,
            [JSON.stringify(databaseFeatureFlags), guildId]
        )
    }

    public static async createFeatureFlag(name: string, defaultValue: boolean) {
        const pool = DatabaseConnection.getPool();
        const databaseFeatureFlags = await this.getAllFeatureFlags()

        for (const guildId in databaseFeatureFlags) {
            databaseFeatureFlags[guildId][name] = defaultValue
            await pool.query(
                `UPDATE featureFlags SET flags = ? WHERE guild_id = ?;`,
                [JSON.stringify(databaseFeatureFlags[guildId]), guildId]
            )
        }
    }

    public static async checkEmptyFeatureFlags(guildsIds: string[]) {
        const databaseFeatureFlags = await this.getAllFeatureFlags()

        for (const guildId of guildsIds) {
            if (!databaseFeatureFlags[guildId]) {
                await this.saveDefaultFeatureFlags(guildId)
            }

            const guildFlags = databaseFeatureFlags[guildId]
            const defaultFlagsSpit: string[] = Object.keys(DEFAULT_FEATURE_FLAGS).filter((item: string) => !Object.keys(guildFlags).includes(item))
            const databaseSpit: string[] = Object.keys(guildFlags).filter((item: string) => !Object.keys(DEFAULT_FEATURE_FLAGS).includes(item))

            if (defaultFlagsSpit.length > 0) {
                for (const flag of defaultFlagsSpit) {
                    await this.createFeatureFlag(flag, DEFAULT_FEATURE_FLAGS[flag as keyof typeof DEFAULT_FEATURE_FLAGS])
                }
            }

            if (databaseSpit.length > 0) {  // ✅ Adicionei .length > 0
                for (const flag of databaseSpit) {
                    await this.deleteFeatureFlag(flag)
                }
            }
        }
    }

    public static async deleteFeatureFlag(flag: Flag) {
        const pool = DatabaseConnection.getPool();
        const databaseFeatureFlags = await this.getAllFeatureFlags()

        for (const guildId in databaseFeatureFlags) {  // ✅ Trocado de .keys()
            delete databaseFeatureFlags[guildId][flag]
            await pool.query(
                `UPDATE featureFlags SET flags = ? WHERE guild_id = ?;`,
                [JSON.stringify(databaseFeatureFlags[guildId]), guildId]  // ✅ Adicionei guildId
            )
        }
    }

    public static async deleteGuildFeatureFlags(guildId: string) {
        const pool = DatabaseConnection.getPool();
        await pool.query(`DELETE FROM featureFlags WHERE guild_id = ?;`, [guildId])
    }

    public static async saveDefaultFeatureFlags(guildId: string) {
        const pool = DatabaseConnection.getPool();
        await pool.query(`INSERT INTO featureFlags (guild_id, flags) VALUES (?, ?);`, [guildId, JSON.stringify(DEFAULT_FEATURE_FLAGS)])
    }
}