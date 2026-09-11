import type { Database } from '../../../db/index.ts';
import { classes, onlineMembers } from '../../../db/schema.ts';
import type IMembersRepository from '../../../types/repositories/members.repository.ts';

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

export default class MembersRepository implements IMembersRepository {
    constructor(private db: Database) {}

    async saveOnlineMembers(total: number): Promise<void> {
        await this.db.insert(onlineMembers).values({
            quantity: total,
            dt: Temporal.Now.plainDateTimeISO(BRAZIL_TIME_ZONE).round({ smallestUnit: 'second' }).toString(),
        });
    }

    async saveTotalMembers(className: string, total: number, guild_name: string): Promise<void> {
        await this.db
            .insert(classes)
            .values({ class: className, guild_name: guild_name, quantity: total })
            .onConflictDoUpdate({ target: classes.class, set: { quantity: total } });
    }
}
