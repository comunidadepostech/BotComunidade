import { eq } from 'drizzle-orm';
import type IFeatureFlagsRepository from '../../../types/repositories/featureFlagsRepository.interface';
import type { FeatureFlags, GuildFlags } from '../../../types/featureFlags.types.ts';
import type { Database } from '../../../db/index.ts';
import { featureFlags } from '../../../db/schema.ts';
import { DEFAULT_FEATURE_FLAGS } from '../../../utils/constants/flagsConstants.ts';

export default class FeatureFlagsRepository implements IFeatureFlagsRepository {
    constructor(private db: Database) {}

    async updateManyFeatureFlags(records: { guildId: string; flags: Record<string, boolean> }[]): Promise<void> {
        await this.db.transaction(async (tx) => {
            for (const record of records) {
                await tx
                    .insert(featureFlags)
                    .values({ guild_id: record.guildId, flags: record.flags })
                    .onConflictDoUpdate({ target: featureFlags.guild_id, set: { flags: record.flags } });
            }
        });
    }

    async getAllFeatureFlagsRaw(): Promise<{ guild_id: string; flags: GuildFlags }[]> {
        const records = await this.db
            .select({ guild_id: featureFlags.guild_id, flags: featureFlags.flags })
            .from(featureFlags);

        return records.map((record) => ({
            guild_id: record.guild_id,
            flags: record.flags ?? {},
        }));
    }

    async updateFlagByGuildId(guildId: string, flagName: string, value: boolean): Promise<void> {
        const flags = await this.getGuildFeatureFlags(guildId);

        flags[flagName] = value;

        await this.db.update(featureFlags).set({ flags: flags }).where(eq(featureFlags.guild_id, guildId));
    }

    async getGuildFeatureFlags(guildId: string): Promise<GuildFlags> {
        const [record] = await this.db
            .select({ flags: featureFlags.flags })
            .from(featureFlags)
            .where(eq(featureFlags.guild_id, guildId))
            .limit(1);

        return record?.flags ?? {};
    }

    async getAllFeatureFlags(): Promise<FeatureFlags> {
        const records = await this.db
            .select({ guild_id: featureFlags.guild_id, flags: featureFlags.flags })
            .from(featureFlags);

        return records.reduce((acc, record) => {
            acc[record.guild_id] = record.flags ?? {};
            return acc;
        }, {} as FeatureFlags);
    }

    async updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<void> {
        const currentFlags = await this.getGuildFeatureFlags(guildId);

        currentFlags[flag] = value;

        await this.db
            .insert(featureFlags)
            .values({ guild_id: guildId, flags: currentFlags })
            .onConflictDoUpdate({ target: featureFlags.guild_id, set: { flags: currentFlags } });
    }

    async createFeatureFlag(name: string, defaultValue: boolean): Promise<void> {
        const allGuilds = await this.db
            .select({ guild_id: featureFlags.guild_id, flags: featureFlags.flags })
            .from(featureFlags);

        const updates = allGuilds.flatMap((record) => {
            const currentFlags = record.flags ?? {};

            if (currentFlags[name] !== undefined) return [];

            currentFlags[name] = defaultValue;

            return [{ guild_id: record.guild_id, flags: currentFlags }];
        });

        if (updates.length === 0) return;

        await this.db.transaction(async (tx) => {
            for (const update of updates) {
                await tx
                    .update(featureFlags)
                    .set({ flags: update.flags })
                    .where(eq(featureFlags.guild_id, update.guild_id));
            }
        });
    }

    async deleteFeatureFlag(flag: string): Promise<void> {
        const allGuildFlags = await this.db
            .select({ guild_id: featureFlags.guild_id, flags: featureFlags.flags })
            .from(featureFlags);

        const updates = allGuildFlags.flatMap((record) => {
            const currentFlags = record.flags ?? {};

            if (currentFlags[flag] === undefined) return [];

            delete currentFlags[flag];

            return [{ guild_id: record.guild_id, flags: currentFlags }];
        });

        if (updates.length === 0) return;

        await this.db.transaction(async (tx) => {
            for (const update of updates) {
                await tx
                    .update(featureFlags)
                    .set({ flags: update.flags })
                    .where(eq(featureFlags.guild_id, update.guild_id));
            }
        });
    }

    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        await this.db.insert(featureFlags).values({ guild_id: guildId, flags: DEFAULT_FEATURE_FLAGS });
    }
}
