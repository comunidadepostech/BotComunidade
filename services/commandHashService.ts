import fs from 'node:fs';
import { createHash } from 'node:crypto';
import type { CommandHashMap, CommandHashComparisonResult } from '../types/commandHash.types.ts';

/**
 * CommandHashService - Gerencia o cálculo e comparação de hashes de arquivos de comando
 *
 * Responsabilidades:
 * - Calcular SHA256 de arquivos de comando
 * - Comparar hashes do filesystem com os do banco de dados
 * - Detectar comandos novos, modificados e deletados
 *
 * SOLID: Responsabilidade Única - apenas lida com cálculo de hashes
 */
export default class CommandHashService {
    /**
     * Calcula o hash SHA256 de um arquivo
     * @param filePath Caminho completo do arquivo
     * @returns Hash SHA256 em hexadecimal
     */
    public calculateFileHash(filePath: string): string {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return createHash('sha256').update(fileContent).digest('hex');
    }

    /**
     * Calcula hashes para todos os comandos em um diretório
     * @param commandsPath Caminho para o diretório de comandos
     * @returns Mapa de nome_comando -> hash
     */
    public calculateCommandHashes(commandsPath: string): CommandHashMap {
        const hashes: CommandHashMap = {};

        const files = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith('.ts'));

        for (const file of files) {
            const filePath = `${commandsPath}/${file}`;
            const commandName = file.replace('.ts', '');

            try {
                hashes[commandName] = this.calculateFileHash(filePath);
            } catch (error) {
                console.error(
                    `Failed to calculate hash for ${commandName}: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }

        return hashes;
    }

    /**
     * Compara hashes do filesystem com os do banco de dados
     * @param filesystemHashes Hashes dos arquivos
     * @param databaseHashes Hashes armazenados no DB
     * @returns Resultado da comparação
     */
    public compareHashes(
        filesystemHashes: CommandHashMap,
        databaseHashes: CommandHashMap,
    ): CommandHashComparisonResult {
        const modified: string[] = [];
        const deleted: string[] = [];
        const unchanged: string[] = [];
        const newCommands: string[] = [];

        // Verifica comandos no filesystem
        for (const [commandName, hash] of Object.entries(filesystemHashes)) {
            if (!(commandName in databaseHashes)) {
                newCommands.push(commandName);
            } else if (databaseHashes[commandName] === hash) {
                unchanged.push(commandName);
            } else {
                modified.push(commandName);
            }
        }

        // Verifica comandos deletados (existem no DB mas não no filesystem)
        for (const commandName of Object.keys(databaseHashes)) {
            if (!(commandName in filesystemHashes)) {
                deleted.push(commandName);
            }
        }

        return {
            modified,
            deleted,
            unchanged,
            new: newCommands,
        };
    }
}
