import { eq } from 'drizzle-orm';
import type IFeatureFlagsRepository from '../../../../types/repositories/featureFlagsRepository.interface';
import type { FeatureFlags, GuildFlags } from '../../../../types/featureFlags.types.ts';
import type { SqliteDatabase } from '../../sqlite.client.ts';
import { featureFlags } from '../../../../db/sqlite.schema.ts';
import { DEFAULT_FEATURE_FLAGS } from '../../../../utils/constants/flagsConstants.ts';

export default class SqliteFeatureFlagsRepository implements IFeatureFlagsRepository {
    constructor(private db: SqliteDatabase) {}

    async updateManyFeatureFlags(records: { guildId: string; flags: Record<string, boolean> }[]): Promise<void> {
        // O callback de transaction do driver do Bun é síncrono, por isso as queries usam .run()
        this.db.transaction((tx) => {
            for (const record of records) {
                tx.insert(featureFlags)
                    .values({ guild_id: record.guildId, flags: record.flags })
                    .onConflictDoUpdate({ target: featureFlags.guild_id, set: { flags: record.flags } })
                    .run();
            }
        });
    }

    async getAllFeatureFlagsRaw(): Promise<{ guild_id: string; flags: GuildFlags }[]> {
        const records = this.db
            .select({ guild_id: featureFlags.guild_id, flags: featureFlags.flags })
            .from(featureFlags)
            .all();

        return records.map((record) => ({
            guild_id: record.guild_id,
            flags: record.flags ?? {},
        }));
    }

    async updateFlagByGuildId(guildId: string, flagName: string, value: boolean): Promise<void> {
        const flags = await this.getGuildFeatureFlags(guildId);

        flags[flagName] = value;

        this.db.update(featureFlags).set({ flags: flags }).where(eq(featureFlags.guild_id, guildId)).run();
    }

    async getGuildFeatureFlags(guildId: string): Promise<GuildFlags> {
        const record = this.db
            .select({ flags: featureFlags.flags })
            .from(featureFlags)
            .where(eq(featureFlags.guild_id, guildId))
            .limit(1)
            .get();

        return record?.flags ?? {};
    }

    async getAllFeatureFlags(): Promise<FeatureFlags> {
        const records = this.db
            .select({ guild_id: featureFlags.guild_id, flags: featureFlags.flags })
            .from(featureFlags)
            .all();

        return records.reduce((acc, record) => {
            acc[record.guild_id] = record.flags ?? {};
            return acc;
        }, {} as FeatureFlags);
    }

    async updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<void> {
        const currentFlags = await this.getGuildFeatureFlags(guildId);

        currentFlags[flag] = value;

        this.db
            .insert(featureFlags)
            .values({ guild_id: guildId, flags: currentFlags })
            .onConflictDoUpdate({ target: featureFlags.guild_id, set: { flags: currentFlags } })
            .run();
    }

    async createFeatureFlag(name: string, defaultValue: boolean): Promise<void> {
        const allGuilds = await this.getAllFeatureFlagsRaw();

        const updates = allGuilds.flatMap((record) => {
            if (record.flags[name] !== undefined) return [];

            return [{ guild_id: record.guild_id, flags: { ...record.flags, [name]: defaultValue } }];
        });

        this.applyFlagUpdates(updates);
    }

    async deleteFeatureFlag(flag: string): Promise<void> {
        const allGuildFlags = await this.getAllFeatureFlagsRaw();

        const updates = allGuildFlags.flatMap((record) => {
            if (record.flags[flag] === undefined) return [];

            const remainingFlags = { ...record.flags };
            delete remainingFlags[flag];

            return [{ guild_id: record.guild_id, flags: remainingFlags }];
        });

        this.applyFlagUpdates(updates);
    }

    // Insere as flags padrão do servidor sem sobrescrever uma configuração que já exista
    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        this.db
            .insert(featureFlags)
            .values({ guild_id: guildId, flags: { ...DEFAULT_FEATURE_FLAGS } })
            .onConflictDoNothing()
            .run();
    }

    private applyFlagUpdates(updates: { guild_id: string; flags: Record<string, boolean> }[]): void {
        if (updates.length === 0) return;

        this.db.transaction((tx) => {
            for (const update of updates) {
                tx.update(featureFlags)
                    .set({ flags: update.flags })
                    .where(eq(featureFlags.guild_id, update.guild_id))
                    .run();
            }
        });
    }
}
