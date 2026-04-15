import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import {MySQLdatabaseConfig} from "../../infrastructure/dataBaseConfig.ts";

export default class DatabaseConnection {
    private pool: Pool | null = null;

    constructor() {}

    async connect(): Promise<void> {
        if (!this.pool) {
            this.pool = mysql.createPool(MySQLdatabaseConfig)
            const connection = await this.pool.getConnection()
            connection.release()
        }
    }

    getPool(): Pool {
        if (!this.pool) throw new Error("Banco não iniciado, tente chamar connect() primeiro.");
        return this.pool;
    }

    async endConnection(): Promise<void> {
        if (!this.pool) throw new Error("Banco não iniciado, tente chamar connect() primeiro.");
        await this.pool.end();
    }
}