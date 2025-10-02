import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import dotenv from 'dotenv'
dotenv.config();



export class localDataBaseConnect {
    constructor() {
        this._filename = 'db/localDataBase.db';
        this._db = null;
    }

    // Conecta e inicializa as tabelas (apenas uma vez)
    async init() {
        if (this._db) {
            return this._db;
        } else {
            try {
                this._db = await open({
                    filename: this._filename,
                    driver: sqlite3.Database,
                })
                console.info('LOG - Banco de dados local iniciado com sucesso!');
            } catch (err) {
                console.error('ERRO - Erro ao criar o banco de dados:', err)
            }
        }

        // Cria as tabelas se não existir (adicione mais abaixo caso seja necesário)
        await this._db.exec(`
            CREATE TABLE IF NOT EXISTS invites (
                invite VARCHAR(16) PRIMARY KEY NOT NULL,
                role VARCHAR(32) NOT NULL,
                server_id VARCHAR(22) NOT NULL
            );
        `);

        return this._db;
    }

    // Cria ou atualiza um convite
    async saveInvite(invite, role, serverId) {
        await this.init();
        await this._db.run(
            `INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`,
            [invite, role, serverId]
        );
    }

    // Busca um convite pelo código
    async getInvite(invite) {
        await this.init();
        return this._db.get(
            `SELECT invite, role, server_id AS serverId FROM invites WHERE invite = ?`,
            [invite]
        );
    }

    // Remove um convite
    async deleteInvite(invite) {
        await this.init();
        await this._db.run(`DELETE FROM invites WHERE invite = ?`, [invite]);
    }

    // Retorna todos os invites (para cache)
    async getAllInvites() {
        await this.init();
        return this._db.all(`SELECT * FROM invites`);
    }

    endConnection() {
        this._db.close();
    }
}


// Conexão com o banco de dados MySQL externo
export class remoteDataBaseConnect {
    constructor(database) {
        this._database = database;
        this._db = null;
        this.retry = 0;
    }

    async init() {
        if (this._db) return this._db;
        this._db = await this._database.createConnection({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQL_ROOT_PASSWORD,
            database: process.env.MYSQLDATABASE,
            waitForConnections: true
        }).catch(err => {
            console.error('ERRO - Erro ao conectar no MySQL:', err);
            this.retry <= 10 ? this.retry++ : process.exit(1); // Termina o processo se o erro persistir
            this.init()
        });
    }

    async savePoll(poll){
        await this.init();
        await this._db.run(
            `INSERT INTO polls (poll_id, poll_json) VALUES (?, ?)`,
            [poll.id, JSON.stringify(poll)]
        );
    }

    endConnection() {
        this._db.end();
    }
}
