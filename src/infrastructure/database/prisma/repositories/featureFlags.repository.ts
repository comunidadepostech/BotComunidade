import type IFeatureFlagsRepository from '../../../../types/repositories/featureFlagsRepository.interface';
import type { FeatureFlags, GuildFlags } from '../../../../types/featureFlags.types.ts';
import type { Database } from '../../../../prisma/db.ts';
import { DEFAULT_FEATURE_FLAGS } from '../../../../utils/constants/flagsConstants.ts';

export default class FeatureFlagsRepository implements IFeatureFlagsRepository {
    constructor(private db: Database) {}

    async updateManyFeatureFlags(records: { guildId: string; flags: Record<string, boolean> }[]): Promise<void> {
        await this.db.transaction(async (tx) => {
            for (const record of records) {
                await tx.orm.public.FeatureFlags.upsert({
                    create: {
                        guild_id: record.guildId,
                        flags: record.flags,
                    },
                    update: {
                        flags: record.flags,
                    },
                });
            }
        });
    }

    async getAllFeatureFlagsRaw(): Promise<{ guild_id: string; flags: GuildFlags }[]> {
        const records = await this.db.orm.public.FeatureFlags.select('guild_id', 'flags').all();

        return records.map((record) => ({
            guild_id: record.guild_id,
            flags: (record.flags as unknown as GuildFlags) || {},
        }));
    }

    async updateFlagByGuildId(guildId: string, flagName: string, value: boolean): Promise<void> {
        const flags = await this.getGuildFeatureFlags(guildId);

        flags[flagName] = value;

        await this.db.orm.public.FeatureFlags.where({ guild_id: guildId }).update({
            flags: flags,
        });
    }

    async getGuildFeatureFlags(guildId: string): Promise<GuildFlags> {
        const record = await this.db.orm.public.FeatureFlags.select('flags').first({ guild_id: guildId });

        if (!record) return {};

        return (record.flags as unknown as GuildFlags) || {};
    }

    async getAllFeatureFlags(): Promise<FeatureFlags> {
        const records = await this.db.orm.public.FeatureFlags.select('guild_id', 'flags').all();

        return records.reduce((acc, record) => {
            acc[record.guild_id] = (record.flags as unknown as Record<string, boolean>) || {};
            return acc;
        }, {} as FeatureFlags);
    }

    async updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<void> {
        const record = await this.db.orm.public.FeatureFlags.select('flags').first({ guild_id: guildId });

        const currentFlags = (record?.flags as unknown as Record<string, boolean>) || {};

        currentFlags[flag] = value;

        await this.db.orm.public.FeatureFlags.upsert({
            create: { guild_id: guildId, flags: currentFlags },
            update: { flags: currentFlags },
        });
    }

    async createFeatureFlag(name: string, defaultValue: boolean): Promise<void> {
        const allGuilds = await this.db.orm.public.FeatureFlags.select('guild_id', 'flags').all();

        const updates = allGuilds.flatMap((record) => {
            const currentFlags = (record.flags as unknown as Record<string, boolean>) || {};

            if (currentFlags[name] !== undefined) return [];

            currentFlags[name] = defaultValue;

            return [{ guild_id: record.guild_id, flags: currentFlags }];
        });

        if (updates.length === 0) return;

        await this.db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.orm.public.FeatureFlags.where({ guild_id: update.guild_id }).update({ flags: update.flags });
            }
        });
    }

    async deleteFeatureFlag(flag: string): Promise<void> {
        const allGuildFlags = await this.db.orm.public.FeatureFlags.select('guild_id', 'flags').all();

        const updates = allGuildFlags.flatMap((record) => {
            const currentFlags = (record.flags as unknown as Record<string, boolean>) || {};

            if (currentFlags[flag] === undefined) return [];

            delete currentFlags[flag];

            return [{ guild_id: record.guild_id, flags: currentFlags }];
        });

        if (updates.length === 0) return;

        await this.db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.orm.public.FeatureFlags.where({ guild_id: update.guild_id }).update({ flags: update.flags });
            }
        });
    }

    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        await this.db.orm.public.FeatureFlags.create({
            guild_id: guildId,
            flags: DEFAULT_FEATURE_FLAGS,
        });
    }
}
