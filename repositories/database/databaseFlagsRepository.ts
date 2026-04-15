import DatabaseConnection from "./databaseConnection.ts"
import type {IFeatureFlagsRepository, GlobalFlags, IGuildFlags} from "../../types/featureFlags.types.ts"
import {DEFAULT_FEATURE_FLAGS} from "../../constants/flagsConstants.ts";
import type {RowDataPacket} from "mysql2/promise";

export default class DatabaseFlagsRepository implements IFeatureFlagsRepository {
    constructor(private databaseConnection: DatabaseConnection){}

    async getGuildFeatureFlags(guildId: string): Promise<IGuildFlags | null> {
        const pool = this.databaseConnection.getPool();
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM featureFlags WHERE guild_id = ?`, [guildId]);

        for (const row of rows) {
            if (row["guild_id"] === guildId) return row["flags"]
        }

        return null
    }

    async getAllFeatureFlags(): Promise<GlobalFlags> {
        const pool = this.databaseConnection.getPool();
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM featureFlags`);

        const flags: { [key: string]: IGuildFlags } = {}

        for (const row of rows) {
            flags[row["guild_id"]] = row["flags"]
        }

        return flags
    }

    async updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<void> {
        const pool = this.databaseConnection.getPool();
        const databaseFeatureFlags = await this.getGuildFeatureFlags(guildId)

        if (!databaseFeatureFlags) throw new Error(`Feature flag '${flag}' não encontrada no banco de dados`)

        databaseFeatureFlags[flag] = value

        await pool.query(
            `UPDATE featureFlags SET flags = ? WHERE guild_id = ?;`,
            [JSON.stringify(databaseFeatureFlags), guildId]
        )
    }

    async createFeatureFlag(name: string, defaultValue: boolean): Promise<void> {
        const pool = this.databaseConnection.getPool();
        const databaseFeatureFlags = await this.getAllFeatureFlags()

        for (const guildId in databaseFeatureFlags) {
            databaseFeatureFlags[guildId]![name] = defaultValue
            await pool.query(
                `UPDATE featureFlags SET flags = ? WHERE guild_id = ?;`,
                [JSON.stringify(databaseFeatureFlags[guildId]), guildId]
            )
        }
    }

    async checkEmptyFeatureFlags(guildsIds: string[]): Promise<void> {
        const databaseFeatureFlags = await this.getAllFeatureFlags()

        for (const guildId of guildsIds) {
            if (!databaseFeatureFlags[guildId]) {
                await this.saveDefaultFeatureFlags(guildId)
                databaseFeatureFlags[guildId] = { ...DEFAULT_FEATURE_FLAGS };
            }

            const guildFlags = databaseFeatureFlags[guildId]

            const defaultFlagsSpit: string[] = Object.keys(DEFAULT_FEATURE_FLAGS).filter((item: string) => !Object.keys(guildFlags).includes(item))
            const databaseSpit: string[] = Object.keys(guildFlags).filter((item: string) => !Object.keys(DEFAULT_FEATURE_FLAGS).includes(item))

            if (defaultFlagsSpit.length > 0) {
                for (const flag of defaultFlagsSpit) {
                    await this.createFeatureFlag(flag, DEFAULT_FEATURE_FLAGS[flag as keyof typeof DEFAULT_FEATURE_FLAGS])
                }
            }

            if (databaseSpit.length > 0) {
                for (const flag of databaseSpit) {
                    await this.deleteFeatureFlag(flag)
                }
            }
        }
    }

    async deleteFeatureFlag(flag: string): Promise<void> {
        const pool = this.databaseConnection.getPool();
        const databaseFeatureFlags = await this.getAllFeatureFlags()

        for (const guildId in databaseFeatureFlags) {
            delete databaseFeatureFlags[guildId]![flag]
            await pool.query(
                `UPDATE featureFlags SET flags = ? WHERE guild_id = ?;`,
                [JSON.stringify(databaseFeatureFlags[guildId]), guildId]
            )
        }
    }

    async deleteGuildFeatureFlags(guildId: string): Promise<void> {
        const pool = this.databaseConnection.getPool();
        await pool.query(`DELETE FROM featureFlags WHERE guild_id = ?;`, [guildId])
    }

    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        const pool = this.databaseConnection.getPool();
        await pool.query(`INSERT INTO featureFlags (guild_id, flags) VALUES (?, ?);`, [guildId, JSON.stringify(DEFAULT_FEATURE_FLAGS)])
    }
}