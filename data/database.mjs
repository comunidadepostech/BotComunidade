import dotenv from 'dotenv'
import {MongoClient} from "mongodb";
dotenv.config();


export class DataBaseConnect {
    constructor() {
        this._uri = process.env.MONGODB_URI;
        this._client = null;
        this._db = null;
        this._collection = null;
    }

    // Conecta e inicializa a coleção (apenas uma vez)
    async init() {
        if (this._client) {
            return this._db;
        } else {
            try {
                this._client = await MongoClient.connect(this._uri);
                this._db = this._client.db('discordBot');
                this._collection = this._db.collection('invites');
                console.info('LOG - Banco de dados MongoDB iniciado com sucesso!');
            } catch (err) {
                console.error('ERRO - Erro ao conectar ao banco de dados:', err)
            }
        }
        return this._db;
    }

    // Cria ou atualiza um convite
    async saveInvite(invite, role, serverId) {
        await this.init();
        await this._collection.updateOne(
            {invite},
            {$set: {invite, role, server_id: serverId}},
            {upsert: true}
        );
    }

    // Busca um convite pelo código
    async getInvite(invite) {
        await this.init();
        const result = await this._collection.findOne({invite});
        if (result) {
            result.serverId = result.server_id;
            delete result.server_id;
        }
        return result;
    }

    // Remove um convite
    async deleteInvite(invite) {
        await this.init();
        await this._collection.deleteOne({invite});
    }

    // Retorna todos os invites (para cache)
    async getAllInvites() {
        await this.init();
        return this._collection.find({}).toArray();
    }

    endConnection() {
        if (this._client) {
            this._client.close();
        }
    }
}

