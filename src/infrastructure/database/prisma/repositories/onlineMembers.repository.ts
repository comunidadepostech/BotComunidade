import type { Database } from '../../../../prisma/db.ts';
import type IMembersRepository from '../../../../types/repositories/members.repository.ts';

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

export default class MembersRepository implements IMembersRepository {
    constructor(private db: Database) {}

    async saveOnlineMembers(total: number): Promise<void> {
        await this.db.orm.public.OnlineMembers.create({
            quantity: total,
            dt: Temporal.Now.plainDateTimeISO(BRAZIL_TIME_ZONE).round({ smallestUnit: 'second' }),
        });
    }

    async saveTotalMembers(className: string, total: number, guild_name: string): Promise<void> {
        await this.db.orm.public.Classes.upsert({
            create: {
                class: className,
                guild_name: guild_name,
                quantity: total,
            },
            update: {
                quantity: total,
            },
            conflictOn: { class: className },
        });
    }
}
