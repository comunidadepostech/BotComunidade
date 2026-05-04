import { describe, expect, it, mock, beforeEach } from 'bun:test';
import DatabaseConnection from '../repositories/database/databaseConnection.ts';
import { DatabaseError } from '../types/errors.ts';

// Mocking the mysql2/promise module
mock.module('mysql2/promise', () => {
    return {
        default: {
            createPool: mock(() => ({
                getConnection: mock(() =>
                    Promise.resolve({
                        release: mock(() => {}),
                    }),
                ),
                end: mock(() => Promise.resolve()),
            })),
        },
    };
});

describe('DatabaseConnection', () => {
    let dbConnection: DatabaseConnection;

    beforeEach(() => {
        dbConnection = new DatabaseConnection();
    });

    describe('Initialization', () => {
        it('should start without an initialized pool', () => {
            expect(() => dbConnection.getPool()).toThrow(DatabaseError);
        });
    });

    describe('connect()', () => {
        it('should successfully create a pool and verify connection', async () => {
            await dbConnection.connect();
            const pool = dbConnection.getPool();
            expect(pool).toBeDefined();
        });

        it('should not create a new pool if one already exists', async () => {
            await dbConnection.connect();
            const firstPool = dbConnection.getPool();
            await dbConnection.connect();
            const secondPool = dbConnection.getPool();
            expect(firstPool).toBe(secondPool);
        });

        it('should throw DatabaseError if connection fails', async () => {
            const { default: mysqlMock } = await import('mysql2/promise');
            (mysqlMock.createPool as any).mockImplementationOnce(() => ({
                getConnection: mock(() => Promise.reject(new Error('Connection failed'))),
            }));

            expect(dbConnection.connect()).rejects.toThrow(DatabaseError);
        });
    });

    describe('getPool()', () => {
        it('should throw DatabaseError if pool is not initialized', () => {
            expect(() => dbConnection.getPool()).toThrow(/not initialized/);
        });

        it('should return the pool if it has been initialized', async () => {
            await dbConnection.connect();
            expect(dbConnection.getPool()).toBeDefined();
        });
    });

    describe('endConnection()', () => {
        it('should throw DatabaseError if pool is not initialized', async () => {
            expect(dbConnection.endConnection()).rejects.toThrow(DatabaseError);
        });

        it('should successfully close the pool if initialized', async () => {
            await dbConnection.connect();
            await expect(dbConnection.endConnection()).resolves.toBeUndefined();
        });

        it('should throw DatabaseError if closing the pool fails', async () => {
            await dbConnection.connect();
            const pool = dbConnection.getPool();
            (pool.end as any).mockImplementationOnce(() => {
                throw new Error('Close failed');
            });

            expect(dbConnection.endConnection()).rejects.toThrow(DatabaseError);
        });
    });
});
