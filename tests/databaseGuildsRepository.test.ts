import { describe, expect, it, mock, beforeEach } from 'bun:test';
import DatabaseGuildsRepository from '../repositories/database/databaseGuildsRepository.ts';
import { DatabaseError } from '../types/errors.ts';

describe('DatabaseGuildsRepository', () => {
    let repository: DatabaseGuildsRepository;
    let mockPool: any;
    let mockDatabaseConnection: any;

    beforeEach(() => {
        mockPool = {
            execute: mock(async () => [[]]),
        };

        mockDatabaseConnection = {
            getPool: mock(() => mockPool),
        };

        repository = new DatabaseGuildsRepository(mockDatabaseConnection);
    });

    describe('syncGuilds', () => {
        it('should successfully sync guilds from database', async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev, QA',
                },
                {
                    guild_id: '987654321',
                    guild_name: 'ADJT',
                    clusters: 'DevOps',
                },
            ];

            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockPool.execute.mock.calls[0][0]).toContain('SELECT guild_id, guild_name, clusters FROM guilds');
        });

        it('should throw DatabaseError if query fails', async () => {
            mockPool.execute.mockRejectedValue(new Error('Database connection failed'));

            try {
                await repository.syncGuilds();
                expect.unreachable('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
            }
        });

        it('should skip invalid guild rows during sync', async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev',
                },
                {
                    guild_id: null, // Invalid
                    guild_name: 'INVALID',
                    clusters: 'QA',
                },
            ];

            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            // Should only load the first guild
            const guildId = repository.getGuildIdByCourse('SOAT');
            expect(guildId).toBe('123456789');
        });

        it('should parse clusters correctly from comma-separated string', async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev, QA, DevOps',
                },
            ];

            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            const guildIds = repository.getGuildIdsByCluster('QA');
            expect(guildIds).toContain('123456789');
        });
    });

    describe('getGuildIdByCourse', () => {
        beforeEach(async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev',
                },
                {
                    guild_id: '987654321',
                    guild_name: 'ADJT',
                    clusters: 'QA',
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);
            await repository.syncGuilds();
        });

        it('should return guild ID for valid course name', () => {
            const guildId = repository.getGuildIdByCourse('SOAT');
            expect(guildId).toBe('123456789');
        });

        it('should return undefined for non-existent course', () => {
            const guildId = repository.getGuildIdByCourse('NONEXISTENT');
            expect(guildId).toBeUndefined();
        });

        it('should be case-sensitive', () => {
            const guildId = repository.getGuildIdByCourse('soat');
            expect(guildId).toBeUndefined();
        });
    });

    describe('getGuildCourseById', () => {
        beforeEach(async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev',
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);
            await repository.syncGuilds();
        });

        it('should return course name for valid guild ID', () => {
            const courseName = repository.getGuildCourseById('123456789');
            expect(courseName).toBe('SOAT');
        });

        it('should return undefined for non-existent guild ID', () => {
            const courseName = repository.getGuildCourseById('999999999');
            expect(courseName).toBeUndefined();
        });
    });

    describe('getGuildIdsByCluster', () => {
        beforeEach(async () => {
            const mockRows = [
                {
                    guild_id: '111111111',
                    guild_name: 'SOAT',
                    clusters: 'Dev, QA',
                },
                {
                    guild_id: '222222222',
                    guild_name: 'ADJT',
                    clusters: 'DevOps',
                },
                {
                    guild_id: '333333333',
                    guild_name: 'FIAP',
                    clusters: 'Dev, DevOps',
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);
            await repository.syncGuilds();
        });

        it('should return all guild IDs for a specific cluster', () => {
            const guildIds = repository.getGuildIdsByCluster('Dev');
            expect(guildIds).toContain('111111111');
            expect(guildIds).toContain('333333333');
            expect(guildIds).not.toContain('222222222');
        });

        it('should return empty array for non-existent cluster', () => {
            const guildIds = repository.getGuildIdsByCluster('NonExistent');
            expect(guildIds).toEqual([]);
        });

        it('should handle single cluster guild', () => {
            const guildIds = repository.getGuildIdsByCluster('DevOps');
            expect(guildIds).toContain('222222222');
            expect(guildIds).toContain('333333333');
        });

        it('should return correct guild IDs for multiple clusters', () => {
            const devGuilds = repository.getGuildIdsByCluster('Dev');
            expect(devGuilds.length).toBe(2);

            const qaGuilds = repository.getGuildIdsByCluster('QA');
            expect(qaGuilds.length).toBe(1);

            const devopsGuilds = repository.getGuildIdsByCluster('DevOps');
            expect(devopsGuilds.length).toBe(2);
        });
    });

    describe('addOrUpdateGuild', () => {
        it('should insert a new guild successfully', async () => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            await repository.addOrUpdateGuild('123456789', 'NEWGUILD', 'Dev, QA');

            expect(mockPool.execute).toHaveBeenCalled();
            const callArgs = mockPool.execute.mock.calls[0];
            expect(callArgs[0]).toContain('INSERT INTO guilds');
            expect(callArgs[1]).toEqual(['123456789', 'NEWGUILD', 'Dev, QA']);
        });

        it('should update existing guild when called with same guild ID', async () => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            await repository.addOrUpdateGuild('123456789', 'UPDATED_NAME', 'DevOps');

            expect(mockPool.execute).toHaveBeenCalled();
            const callArgs = mockPool.execute.mock.calls[0];
            expect(callArgs[0]).toContain('ON DUPLICATE KEY UPDATE');
        });

        it('should update in-memory cache after adding/updating guild', async () => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            // First, sync with empty database
            mockPool.execute.mockResolvedValueOnce([[]]);
            await repository.syncGuilds();

            // Then add a guild
            mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            await repository.addOrUpdateGuild('123456789', 'TESTGUILD', 'Dev');

            // Verify it's in the cache
            const guildId = repository.getGuildIdByCourse('TESTGUILD');
            expect(guildId).toBe('123456789');
        });

        it('should throw DatabaseError if insert/update fails', async () => {
            mockPool.execute.mockRejectedValue(new Error('Insert failed'));

            try {
                await repository.addOrUpdateGuild('123456789', 'GUILD', 'Dev');
                expect.unreachable('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
            }
        });

        it('should parse clusters correctly when adding guild', async () => {
            mockPool.execute.mockResolvedValueOnce([[]]);
            await repository.syncGuilds();

            mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            await repository.addOrUpdateGuild('123456789', 'GUILD', 'Dev, QA, DevOps');

            const guildIds = repository.getGuildIdsByCluster('QA');
            expect(guildIds).toContain('123456789');
        });
    });

    describe('Multiple guild management', () => {
        it('should handle multiple guilds with overlapping clusters correctly', async () => {
            const mockRows = [
                {
                    guild_id: '111111111',
                    guild_name: 'SOAT',
                    clusters: 'Dev, QA',
                },
                {
                    guild_id: '222222222',
                    guild_name: 'ADJT',
                    clusters: 'Dev, DevOps',
                },
                {
                    guild_id: '333333333',
                    guild_name: 'FIAP',
                    clusters: 'QA, DevOps',
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            const devGuilds = repository.getGuildIdsByCluster('Dev');
            expect(devGuilds.length).toBe(2);
            expect(devGuilds).toContain('111111111');
            expect(devGuilds).toContain('222222222');

            const qaGuilds = repository.getGuildIdsByCluster('QA');
            expect(qaGuilds.length).toBe(2);
            expect(qaGuilds).toContain('111111111');
            expect(qaGuilds).toContain('333333333');
        });

        it('should maintain separate lookups for different guild properties', async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev',
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            // All three lookup methods should work
            expect(repository.getGuildIdByCourse('SOAT')).toBe('123456789');
            expect(repository.getGuildCourseById('123456789')).toBe('SOAT');
            expect(repository.getGuildIdsByCluster('Dev')).toContain('123456789');
        });
    });

    describe('Edge cases', () => {
        it('should handle guilds with spaces in cluster names', async () => {
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: 'Dev, QA, DevOps',
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            // Should find guilds with properly trimmed cluster names
            expect(repository.getGuildIdsByCluster('QA')).toContain('123456789');
        });

        it('should handle empty database gracefully', async () => {
            mockPool.execute.mockResolvedValue([[]]);

            await repository.syncGuilds();

            expect(repository.getGuildIdByCourse('ANY')).toBeUndefined();
            expect(repository.getGuildIdsByCluster('ANY')).toEqual([]);
        });

        it('should handle very long cluster lists', async () => {
            const clusterList = Array.from({ length: 20 }, (_, i) => `Cluster${i}`).join(', ');
            const mockRows = [
                {
                    guild_id: '123456789',
                    guild_name: 'SOAT',
                    clusters: clusterList,
                },
            ];
            mockPool.execute.mockResolvedValue([mockRows]);

            await repository.syncGuilds();

            expect(repository.getGuildIdsByCluster('Cluster5')).toContain('123456789');
            expect(repository.getGuildIdsByCluster('Cluster19')).toContain('123456789');
        });
    });
});
