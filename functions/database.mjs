import mysql from "mysql2/promise";
import {defaultFlags} from "../main.js";

export class DataBase {
    constructor() {
        this._client = null;
    }

    async init() {
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
        const conn = await this.init();
        await conn.query(`CREATE TABLE IF NOT EXISTS invites (
            invite VARCHAR(255) PRIMARY KEY,
            role VARCHAR(255) NOT NULL,
            server_id VARCHAR(255) NOT NULL
        )`);

        await conn.query(`CREATE TABLE IF NOT EXISTS flags (
            server_id VARCHAR(255) NOT NULL PRIMARY KEY,
            flag VARCHAR(255) NOT NULL
        )`);
    }

    async saveInvite(invite, role, serverId) {
        const conn = await this.init();
        await conn.query(`INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`, [invite, role, serverId]);
    }

    async getInvite(invite) {
        const conn = await this.init();
        const [rows] = await conn.query(`SELECT * FROM invites WHERE invite = ?`, [invite]);
        return rows[0] || null;
    }

    async deleteInvite(invite) {
        const conn = await this.init();
        await conn.query(`DELETE FROM invites WHERE invite = ?`, [invite]);
    }

    async getAllInvites() {
        const conn = await this.init();
        const [rows] = await conn.query(`SELECT * FROM invites`);
        return rows;
    }

    async getFlags(serverId = null) {
        const conn = await this.init();
        let rows = [];
        if (serverId) {
            [rows] = await conn.query(`SELECT * FROM flags WHERE server_id = ?`, [serverId])
        } else {
            [rows] = await conn.query(`SELECT * FROM flags`)
        }

        const flags = {};
        for (const { server_id, flag } of rows) {
            flags[server_id] = JSON.parse(flag);
        }

        return flags;
    }

    async updateFlag(serverId, flagName, value) {
        const conn = await this.init();
        const [rows] = await conn.query(`SELECT flag FROM flags WHERE server_id = ?`, [serverId]);

        let flags = {};
        if (rows.length > 0 && rows[0].flag) {
            flags = JSON.parse(rows[0].flag);
        }

        flags[flagName] = value;

        await conn.query(
            `INSERT INTO flags (server_id, flag)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE flag = VALUES(flag)`,
            [serverId, JSON.stringify(flags)]
        );
    }

    async setFlags(serverId, flags) {
        const conn = await this.init();
        await conn.query(`INSERT INTO flags (server_id, flag) VALUES (?, ?) ON DUPLICATE KEY UPDATE flag = VALUES(flag)`, [serverId, JSON.stringify(flags)])
    }

    async endConnection() {
        if (this._client) {
            await this._client.end();
            this._client = null;
        }
    }
}