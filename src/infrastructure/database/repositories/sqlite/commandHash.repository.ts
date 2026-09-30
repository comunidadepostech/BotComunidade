import { eq, inArray } from 'drizzle-orm';
import type ICommandHashRepository from '../../../../types/repositories/commandHashRepository.interface';
import type { SqliteDatabase } from '../../sqlite.client.ts';
import { commandHashes } from '../../../../db/sqlite.schema.ts';

export default class SqliteCommandHashRepository implements ICommandHashRepository {
    constructor(private db: SqliteDatabase) {}

    async getAllCommands(): Promise<{ command_name: string; file_hash: string }[]> {
        return this.db
            .select({ command_name: commandHashes.command_name, file_hash: commandHashes.file_hash })
            .from(commandHashes)
            .all();
    }

    async getCommandByName(commandName: string): Promise<{ command_name: string; file_hash: string } | null> {
        const command = this.db
            .select({ command_name: commandHashes.command_name, file_hash: commandHashes.file_hash })
            .from(commandHashes)
            .where(eq(commandHashes.command_name, commandName))
            .limit(1)
            .get();

        return command ?? null;
    }

    async saveCommand(commandName: string, hash: string): Promise<void> {
        this.db
            .insert(commandHashes)
            .values({ command_name: commandName, file_hash: hash })
            .onConflictDoUpdate({ target: commandHashes.command_name, set: { file_hash: hash } })
            .run();
    }

    async deleteCommand(commandName: string | string[]): Promise<void> {
        const names = Array.isArray(commandName) ? commandName : [commandName];

        this.db.delete(commandHashes).where(inArray(commandHashes.command_name, names)).run();
    }

    async clearAllCommands(): Promise<void> {
        this.db.delete(commandHashes).run();
    }

    async updateCommand(commandName: string, hash: string): Promise<void> {
        this.db.update(commandHashes).set({ file_hash: hash }).where(eq(commandHashes.command_name, commandName)).run();
    }
}
