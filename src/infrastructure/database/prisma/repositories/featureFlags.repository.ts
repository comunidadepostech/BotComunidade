import type IFeatureFlagsRepository from '../../../../types/repositories/featureFlagsRepository.interface';
import type { FeatureFlags, GuildFlags } from '../../../../types/featureFlags.types.ts';
import type { PrismaClient } from '../../../../../prisma/generated/client.ts';
import { DEFAULT_FEATURE_FLAGS } from '../../../../utils/constants/flagsConstants.ts';

export default class FeatureFlagsRepository implements IFeatureFlagsRepository {
    constructor(private db: PrismaClient) {}

    async updateManyFeatureFlags(records: { guildId: string; flags: Record<string, boolean> }[]): Promise<void> {
        const operations = records.map((record) =>
            this.db.featureFlags.upsert({
                where: { guild_id: record.guildId }, // Ou 'guild_id', conforme o nome do campo no seu schema.prisma
                update: {
                    flags: record.flags,
                },
                create: {
                    guild_id: record.guildId,
                    flags: record.flags,
                },
            }),
        );

        await this.db.$transaction(operations);
    }

    async getAllFeatureFlagsRaw(): Promise<{ guild_id: string; flags: GuildFlags }[]> {
        const records = await this.db.featureFlags.findMany();

        return records.map((record) => ({
            guild_id: record.guild_id,
            flags: (record.flags as unknown as GuildFlags) || {},
        }));
    }

    async updateFlagByGuildId(guildId: string, flagName: string, value: boolean): Promise<void> {
        const flags = await this.getGuildFeatureFlags(guildId);

        flags[flagName] = value;

        await this.db.featureFlags.update({
            where: {
                guild_id: guildId,
            },
            data: {
                flags: flags,
            },
        });
    }

    async getGuildFeatureFlags(guildId: string): Promise<GuildFlags> {
        const record = await this.db.featureFlags.findUnique({
            where: { guild_id: guildId },
        });

        if (!record) return {};

        return (record.flags as unknown as GuildFlags) || {};
    }

    async getAllFeatureFlags(): Promise<FeatureFlags> {
        const records = await this.db.featureFlags.findMany();

        return records.reduce((acc, record) => {
            acc[record.guild_id] = (record.flags as unknown as Record<string, boolean>) || {};
            return acc;
        }, {} as FeatureFlags);
    }

    async updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<void> {
        const record = await this.db.featureFlags.findUnique({
            where: { guild_id: guildId },
        });

        const currentFlags = (record?.flags as unknown as Record<string, boolean>) || {};

        currentFlags[flag] = value;

        await this.db.featureFlags.upsert({
            where: { guild_id: guildId },
            update: { flags: currentFlags },
            create: { guild_id: guildId, flags: currentFlags },
        });
    }

    async createFeatureFlag(name: string, defaultValue: boolean): Promise<void> {
        const allGuilds = await this.db.featureFlags.findMany();
        const updates = [];

        for (const record of allGuilds) {
            const currentFlags = (record.flags as unknown as Record<string, boolean>) || {};

            if (currentFlags[name] === undefined) {
                currentFlags[name] = defaultValue;

                updates.push(
                    this.db.featureFlags.update({
                        where: { guild_id: record.guild_id },
                        data: { flags: currentFlags },
                    }),
                );
            }
        }

        if (updates.length > 0) {
            await this.db.$transaction(updates);
        }
    }

    async deleteFeatureFlag(flag: string): Promise<void> {
        const allGuildFlags = await this.db.featureFlags.findMany();

        const updates = [];

        for (const record of allGuildFlags) {
            const currentFlags = (record.flags as unknown as Record<string, boolean>) || {};

            if (currentFlags[flag] === undefined) {
                continue;
            }

            delete currentFlags[flag];

            updates.push(
                this.db.featureFlags.update({
                    where: {
                        guild_id: record.guild_id,
                    },
                    data: {
                        flags: currentFlags,
                    },
                }),
            );
        }

        if (updates.length > 0) {
            await this.db.$transaction(updates);
        }
    }

    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        await this.db.featureFlags.create({
            data: {
                guild_id: guildId,
                flags: DEFAULT_FEATURE_FLAGS,
            },
        });
    }
}
