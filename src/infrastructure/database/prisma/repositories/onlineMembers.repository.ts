import { PrismaClient } from '../../../../../prisma/generated/client.ts';
import type IMembersRepository from '../../../../types/repositories/members.repository.ts';

export default class MembersRepository implements IMembersRepository {
    constructor(private db: PrismaClient) {}

    async saveOnlineMembers(total: number): Promise<void> {
        await this.db.online_members.create({
            data: {
                quantity: total,
                dt: new Date(new Date().getTime() - (3 * 60 * 60 * 1000)).toISOString().slice(0, -1) + '-03:00', // Brazil fuse ISO string
            },
        });
    }

    async saveTotalMembers(className: string, total: number, guild_name: string): Promise<void> {
        await this.db.classes.upsert({
            where: {
                class: className,
            },
            update: {
                quantity: total,
            },
            create: {
                class: className,
                guild_name: guild_name,
                quantity: total
            },
        });
    }
}
