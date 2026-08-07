import type ICommandHashRepository from '../../../../types/repositories/commandHashRepository.interface';
import { PrismaClient } from '../../../../../prisma/generated/client.ts';

export default class CommandHashRepository implements ICommandHashRepository {
    constructor(private db: PrismaClient) {}

    async getAllCommands(): Promise<{ command_name: string; file_hash: string }[]> {
        return await this.db.command_hashes.findMany();
    }

    async getCommandByName(commandName: string): Promise<{ command_name: string; file_hash: string } | null> {
        return await this.db.command_hashes.findUnique({
            where: { command_name: commandName },
        });
    }

    async saveCommand(commandName: string, hash: string): Promise<void> {
        await this.db.command_hashes.upsert({
            create: {
                command_name: commandName,
                file_hash: hash,
            },
            update: {
                file_hash: hash,
            },
            where: {
                command_name: commandName,
            },
        });
    }

    async deleteCommand(commandName: string | string[]): Promise<void> {
        await this.db.command_hashes.deleteMany({
            where: {
                command_name: Array.isArray(commandName) ? { in: commandName } : commandName,
            },
        });
    }

    async clearAllCommands(): Promise<void> {
        await this.db.command_hashes.deleteMany({});
    }

    async updateCommand(commandName: string, hash: string): Promise<void> {
        await this.db.command_hashes.update({
            where: {
                command_name: commandName,
            },
            data: {
                file_hash: hash,
            },
        });
    }
}
