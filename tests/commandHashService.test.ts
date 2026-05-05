import { describe, expect, it, beforeEach } from 'bun:test';
import CommandHashService from '../services/commandHashService.ts';
import type { CommandHashMap } from '../types/commandHash.types.ts';

describe('CommandHashService', () => {
    let service: CommandHashService;

    beforeEach(() => {
        service = new CommandHashService();
    });

    describe('calculateFileHash', () => {
        it('should calculate SHA256 hash of a file', () => {
            // Criar um arquivo temporário para teste
            const testFilePath = './test_command.ts';
            const testContent = 'export class TestCommand { test() {} }';
            Bun.write(testFilePath, testContent);

            const hash = service.calculateFileHash(testFilePath);

            expect(hash).toBeDefined();
            expect(hash).toHaveLength(64); // SHA256 em hexadecimal tem 64 caracteres
            expect(hash).toMatch(/^[a-f0-9]{64}$/); // Deve ser hexadecimal válido

            // Limpar arquivo temporário
            import('fs').then((fs) => fs.unlinkSync(testFilePath));
        });

        it('should return same hash for same file content', () => {
            const testFilePath = './test_command2.ts';
            const testContent = 'export class TestCommand { test() {} }';
            Bun.write(testFilePath, testContent);

            const hash1 = service.calculateFileHash(testFilePath);
            const hash2 = service.calculateFileHash(testFilePath);

            expect(hash1).toBe(hash2);

            import('fs').then((fs) => fs.unlinkSync(testFilePath));
        });

        it('should return different hash for different file content', () => {
            const testFile1 = './test_file1.ts';
            const testFile2 = './test_file2.ts';

            Bun.write(testFile1, 'content 1');
            Bun.write(testFile2, 'content 2');

            const hash1 = service.calculateFileHash(testFile1);
            const hash2 = service.calculateFileHash(testFile2);

            expect(hash1).not.toBe(hash2);

            import('fs').then((fs) => {
                fs.unlinkSync(testFile1);
                fs.unlinkSync(testFile2);
            });
        });
    });

    describe('compareHashes', () => {
        it('should identify new commands', () => {
            const filesystemHashes: CommandHashMap = {
                newCommand: 'abc123',
            };
            const databaseHashes: CommandHashMap = {};

            const result = service.compareHashes(filesystemHashes, databaseHashes);

            expect(result.new).toContain('newCommand');
            expect(result.modified).toHaveLength(0);
            expect(result.unchanged).toHaveLength(0);
            expect(result.deleted).toHaveLength(0);
        });

        it('should identify modified commands', () => {
            const filesystemHashes: CommandHashMap = {
                command1: 'hash_novo',
            };
            const databaseHashes: CommandHashMap = {
                command1: 'hash_antigo',
            };

            const result = service.compareHashes(filesystemHashes, databaseHashes);

            expect(result.modified).toContain('command1');
            expect(result.new).toHaveLength(0);
            expect(result.unchanged).toHaveLength(0);
            expect(result.deleted).toHaveLength(0);
        });

        it('should identify deleted commands', () => {
            const filesystemHashes: CommandHashMap = {};
            const databaseHashes: CommandHashMap = {
                deletedCommand: 'hash_antigo',
            };

            const result = service.compareHashes(filesystemHashes, databaseHashes);

            expect(result.deleted).toContain('deletedCommand');
            expect(result.new).toHaveLength(0);
            expect(result.modified).toHaveLength(0);
            expect(result.unchanged).toHaveLength(0);
        });

        it('should identify unchanged commands', () => {
            const filesystemHashes: CommandHashMap = {
                command1: 'same_hash',
            };
            const databaseHashes: CommandHashMap = {
                command1: 'same_hash',
            };

            const result = service.compareHashes(filesystemHashes, databaseHashes);

            expect(result.unchanged).toContain('command1');
            expect(result.new).toHaveLength(0);
            expect(result.modified).toHaveLength(0);
            expect(result.deleted).toHaveLength(0);
        });

        it('should handle complex scenario with all types', () => {
            const filesystemHashes: CommandHashMap = {
                unchanged: 'hash_same',
                modified: 'hash_new',
                new: 'hash_new',
            };
            const databaseHashes: CommandHashMap = {
                unchanged: 'hash_same',
                modified: 'hash_old',
                deleted: 'hash_old',
            };

            const result = service.compareHashes(filesystemHashes, databaseHashes);

            expect(result.unchanged).toContain('unchanged');
            expect(result.modified).toContain('modified');
            expect(result.new).toContain('new');
            expect(result.deleted).toContain('deleted');
        });
    });
});
