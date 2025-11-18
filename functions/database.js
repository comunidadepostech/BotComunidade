import mysql from "mysql2/promise";

export class MySQLDatabase {
    constructor(host, user, password, database, waitForConnections = true) {
        this._client = null
        this.host = host
        this.user = user
        this.password = password
        this.database = database
        this.waitForConnections = waitForConnections
    }

    async connect() {
        this._client = await mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
            waitForConnections: this.waitForConnections
        });
    }

    async verifyTables() {
        await this._client.query(`CREATE TABLE IF NOT EXISTS invites (
            invite CHAR(10) PRIMARY KEY,
            role VARCHAR(100) NOT NULL,
            server_id VARCHAR(19) NOT NULL
        )`);

        await this._client.query(`CREATE TABLE IF NOT EXISTS flags (
            server_id CHAR(19) NOT NULL PRIMARY KEY,
            flag TEXT NOT NULL
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

    async getFlags(serverId = null) {
        let rows = [];
        if (serverId) {
            [rows] = await this._client.query(`SELECT * FROM flags WHERE server_id = ?`, [serverId])
        } else {
            [rows] = await this._client.query(`SELECT * FROM flags`)
        }

        const flags = {};
        for (const { server_id, flag } of rows) {
            flags[server_id] = JSON.parse(flag);
        }

        return flags;
    }

    async updateFlag(serverId, flagName, value) {
        const [rows] = await this._client.query(`SELECT flag FROM flags WHERE server_id = ?`, [serverId]);

        let flags = {};
        if (rows.length > 0 && rows[0].flag) {
            flags = JSON.parse(rows[0].flag);
        }

        flags[flagName] = value;

        await this._client.query(
            `INSERT INTO flags (server_id, flag)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE flag = VALUES(flag)`,
            [serverId, JSON.stringify(flags)]
        );
    }

    async saveFlags(guildId, flags) {
        await this._client.query(`INSERT INTO flags (server_id, flag) VALUES (?, ?) ON DUPLICATE KEY UPDATE flag = VALUES(flag)`, [guildId, JSON.stringify(flags)])
    }

    async createNewFlag(name, defaultValue){
        let flags = await this.getFlags()
        for (let serverID of Object.keys(flags)) {
            flags[serverID][name] = defaultValue
            await this.saveFlags({serverID : flags[serverID]})
        }
    }

    async checkFlags(flags, defaultFlags, client) {
        if (Object.keys(flags).length === 0) {
            if (!this.database) throw new Error("Banco de dados não inicializado");

            for (let [, guild] of client.guilds.cache) {
                console.debug(`DEBUG - Salvando flags padrão para ${guild.name}\n${defaultFlags}`)
                await this.saveFlags(guild.id, defaultFlags)
            }

            return true
        }

        if (Object.keys(flags[Object.keys(flags)[0]]).join() !== Object.keys(defaultFlags).join()) {
            let differences = defaultFlags.keys().filter(x => !Object.keys(flags[Object.keys(flags)[0]]).includes(x))

            for (let difference of differences) {
                console.debug(`Nova flag detectada: ${difference}`)
                await this.createNewFlag(difference, defaultFlags[difference])
            }

            return true
        }
    }

    async endConnection() {
        await this._client.end();
    }
}