import type ICommandHashRepository from '../../../../types/repositories/commandHashRepository.interface';
import type { Database } from '../../../../prisma/db.ts';

export default class CommandHashRepository implements ICommandHashRepository {
    constructor(private db: Database) {}

    async getAllCommands(): Promise<{ command_name: string; file_hash: string }[]> {
        return await this.db.orm.public.CommandHashes.select('command_name', 'file_hash').all();
    }

    async getCommandByName(commandName: string): Promise<{ command_name: string; file_hash: string } | null> {
        return await this.db.orm.public.CommandHashes.select('command_name', 'file_hash').first({
            command_name: commandName,
        });
    }

    async saveCommand(commandName: string, hash: string): Promise<void> {
        await this.db.orm.public.CommandHashes.upsert({
            create: {
                command_name: commandName,
                file_hash: hash,
            },
            update: {
                file_hash: hash,
            },
        });
    }

    async deleteCommand(commandName: string | string[]): Promise<void> {
        const names = Array.isArray(commandName) ? commandName : [commandName];

        await this.db.orm.public.CommandHashes.where((command) => command.command_name.in(names)).deleteAndCount();
    }

    async clearAllCommands(): Promise<void> {
        await this.db.orm.public.CommandHashes.where((command) => command.command_name.isNotNull()).deleteAndCount();
    }

    async updateCommand(commandName: string, hash: string): Promise<void> {
        await this.db.orm.public.CommandHashes.where({ command_name: commandName }).update({
            file_hash: hash,
        });
    }
}
