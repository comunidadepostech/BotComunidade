import mysql, { RowDataPacket } from "mysql2/promise";
import logger from "./utils/logger.js";
import { Client } from "discord.js";

export class MySQLDatabase {
    #client: mysql.Connection | null = null
    #url: string | null = null

    async connect(url: string): Promise<void> {
        this.#url = url
        this.#client = await mysql.createConnection(url)
    }

    async #ensureConnection(): Promise<void> {
        try {
            await this.#client!.ping();
        } catch (error: any) {
            logger.log("Conexão com o banco de dados ausente ou fechada. Reconectando...");
            await this.connect(this.#url!);
        }
    }

    async verifyTables(): Promise<void> {
        await this.#client!.query(`CREATE TABLE IF NOT EXISTS invites (
            invite CHAR(10) PRIMARY KEY,
            role VARCHAR(100) NOT NULL,
            server_id VARCHAR(19) NOT NULL
        )`);

        await this.#client!.query(`CREATE TABLE IF NOT EXISTS flags (
            server_id CHAR(19) NOT NULL PRIMARY KEY,
            flag TEXT NOT NULL
        )`);
    }

    async saveInvite(invite: string, role: string, serverId: string): Promise<void> {
        await this.#ensureConnection();

        await this.#client!.query(`INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`, [invite, role, serverId]);
    }

    async getInvite(invite: string): Promise<RowDataPacket | null> {
        await this.#ensureConnection();

        const [rows] = await this.#client!.query<RowDataPacket[]>(`SELECT * FROM invites WHERE invite = ?`, [invite]);

        return rows[0] || null;
    }

    async deleteInvite(invite: string): Promise<void> {
        await this.#ensureConnection();

        await this.#client!.query(`DELETE FROM invites WHERE invite = ?`, [invite]);
    }

    async getAllInvites(): Promise<RowDataPacket[]> {
        await this.#ensureConnection();

        const [rows] = await this.#client!.query<RowDataPacket[]>(`SELECT * FROM invites`);

        return rows;
    }

    async getFlags(serverId: string | null = null): Promise<Record<string, any>> {
        await this.#ensureConnection();

        let rows;

        if (serverId) {
            [rows] = await this.#client!.query<RowDataPacket[]>(`SELECT * FROM flags WHERE server_id = ?`, [serverId]);
        } else {
            [rows] = await this.#client!.query<RowDataPacket[]>(`SELECT * FROM flags`);
        }

        interface Row {
            server_id: string;
            flag: string;
        }

        const flags: Record<string, any> = {};
        for (const { server_id, flag } of rows as Row[]) {
            flags[server_id] = JSON.parse(flag);
        }

        return flags;
    }

    async updateFlag(serverId: string, flagName: string, value: boolean): Promise<void> {
        await this.#ensureConnection();

        const [rows] = await this.#client!.query<RowDataPacket[]>(`SELECT flag FROM flags WHERE server_id = ?`, [serverId]);

        let flags: Record<string, any> = {};
        if (rows.length > 0 && rows[0].flag) {
            flags = JSON.parse(rows[0].flag);
        }

        flags[flagName] = value;

        await this.#client!.query(
            `INSERT INTO flags (server_id, flag)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE flag = VALUES(flag)`,
            [serverId, JSON.stringify(flags)]
        );
    }

    async saveFlags(guildId: string, flags: object): Promise<void> {
        await this.#ensureConnection();

        await this.#client!.query(`INSERT INTO flags (server_id, flag) VALUES (?, ?) ON DUPLICATE KEY UPDATE flag = VALUES(flag)`, [guildId, JSON.stringify(flags)])
    }

    async createNewFlag(name: string, defaultValue: object): Promise<void> {
        await this.#ensureConnection();

        let flags = await this.getFlags()

        for (let serverID of Object.keys(flags)) {
            flags[serverID][name] = defaultValue
            await this.saveFlags(serverID, flags[serverID])
        }
    }

    async checkFlags(flags: Record<string, any>, defaultFlags: Record<string, any>, client: Client): Promise<boolean> {
        await this.#ensureConnection();

        if (Object.keys(flags).length === 0) {
            for (const [, guild] of client.guilds.cache) {
                logger.debug(`DEBUG - Salvando flags padrão para ${guild.id}\n${JSON.stringify(defaultFlags)}`)
                await this.saveFlags(guild.id, defaultFlags)
            }

            return true
        }

        if (Object.keys(flags[Object.keys(flags)[0]]).join() !== Object.keys(defaultFlags).join()) {
            let differences = Object.keys(defaultFlags).filter(x => !Object.keys(flags[Object.keys(flags)[0]]).includes(x))

            for (let difference of differences) {
                logger.debug(`DEBUG - Nova flag detectada: ${difference}`)
                await this.createNewFlag(difference, defaultFlags[difference])
            }

            return true
        }

        return false
    }

    async endConnection(): Promise<void> {
        await this.#client!.end();
    }
}