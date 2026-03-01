import mysql, { Pool } from "mysql2/promise";
import {MySQLdatabaseConfig} from "../../infrastructure/dataBaseConfig.ts";

export default class DatabaseConnection {
    private static pool: Pool;

    public static async connect() {
        if (!this.pool) {
            this.pool = mysql.createPool(MySQLdatabaseConfig)
            const connection = await this.pool.getConnection()
            connection.release()
        }
    }

    public static getPool(): Pool {
        if (!this.pool) throw new Error("Banco não iniciado, tente chamar connect() primeiro.");
        return this.pool;
    }

    public static async endConnection() {
        await this.pool.end();
    }
}