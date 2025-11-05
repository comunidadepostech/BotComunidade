import mysql from "mysql2/promise";

export class DataBase {
    constructor() {
        this._client = null;
    }

    async connect() {
        if (!this._client) {
            this._client = await mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASS,
                database: process.env.MYSQL_DB,
                waitForConnections: true
            });
            console.info("LOG - Banco de dados MySQL conectado com sucesso!");
        }
        return this._client;
    }

    async verify() {
        await this._client.query(`CREATE TABLE IF NOT EXISTS invites (
            invite VARCHAR(255) PRIMARY KEY,
            role VARCHAR(255) NOT NULL,
            server_id VARCHAR(255) NOT NULL
        )`);

        await this._client.query(`CREATE TABLE IF NOT EXISTS flags (
            server_id VARCHAR(255) NOT NULL PRIMARY KEY,
            flag VARCHAR(255) NOT NULL
        )`);
    }

    async saveInvite(invite, role, serverId) {
        await this._client.query(`INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`, [invite, role, serverId]);
    }

    async getInvite(invite) {
        const [rows] = await this._client.query(`SELECT * FROM invites WHERE invite = ?`, [invite]);
        return rows[0] || null;
    }

    async deleteInvite(invite) {
        await this._client.query(`DELETE FROM invites WHERE invite = ?`, [invite]);
    }

    async getAllInvites() {
        const [rows] = await this._client.query(`SELECT * FROM invites`);
        return rows;
    }

    async endConnection() {
        if (this._client) {
            await this._client.end();
            this._client = null;
        }
    }
}