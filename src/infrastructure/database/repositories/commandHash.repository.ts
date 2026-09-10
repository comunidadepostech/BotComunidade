import { eq, inArray } from 'drizzle-orm';
import type ICommandHashRepository from '../../../types/repositories/commandHashRepository.interface';
import type { Database } from '../../../db/index.ts';
import { commandHashes } from '../../../db/schema.ts';

export default class CommandHashRepository implements ICommandHashRepository {
    constructor(private db: Database) {}

    async getAllCommands(): Promise<{ command_name: string; file_hash: string }[]> {
        return await this.db
            .select({ command_name: commandHashes.command_name, file_hash: commandHashes.file_hash })
            .from(commandHashes);
    }

    async getCommandByName(commandName: string): Promise<{ command_name: string; file_hash: string } | null> {
        const [command] = await this.db
            .select({ command_name: commandHashes.command_name, file_hash: commandHashes.file_hash })
            .from(commandHashes)
            .where(eq(commandHashes.command_name, commandName))
            .limit(1);

        return command ?? null;
    }

    async saveCommand(commandName: string, hash: string): Promise<void> {
        await this.db
            .insert(commandHashes)
            .values({ command_name: commandName, file_hash: hash })
            .onConflictDoUpdate({ target: commandHashes.command_name, set: { file_hash: hash } });
    }

    async deleteCommand(commandName: string | string[]): Promise<void> {
        const names = Array.isArray(commandName) ? commandName : [commandName];

        await this.db.delete(commandHashes).where(inArray(commandHashes.command_name, names));
    }

    async clearAllCommands(): Promise<void> {
        await this.db.delete(commandHashes);
    }

    async updateCommand(commandName: string, hash: string): Promise<void> {
        await this.db.update(commandHashes).set({ file_hash: hash }).where(eq(commandHashes.command_name, commandName));
    }
}
