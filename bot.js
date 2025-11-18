import {Client, GatewayIntentBits} from "discord.js";
import {MySQLDatabase} from "./functions/database.js";

export class Bot {
    constructor() {
        this.client = null
        this.db = null
        this.commands = []
        this.defaultFlags = {}
        this.flags = {}
        this.events = []
        this.webhook = null
    }

    _initializeClient(intents) {
        this.client = new Client({
            intents: intents,
            rest: {
                timeout: 10000,
                retries: 1
            }
        });

        console.log(this.client.options.intents);
    }

    _initializeDefaultFlags(defaultFlags) {
        // Especifica as flags padrão dos comandos e eventos
        this.defaultFlags = defaultFlags
    }

    async _initializeDatabase() {
        // Conecta ao banco de dados com as credenciais definidas no .env
        this.db = new MySQLDatabase(
            process.env.MYSQL_HOST,
            process.env.MYSQL_USER,
            process.env.MYSQL_PASS,
            process.env.MYSQL_DB,
            true
        )
    }

    async registerEvents(){
        for (const event of this.events) {
            if (event.once) {
                // Para eventos como 'ClientReady'
                this.client.once(event.name, async (...args) => await event.execute(this.client, ...args));
            } else {
                // Para eventos como 'InteractionCreate'
                this.client.on(event.name, async (...args) => await event.execute(this.client, ...args));
            }
        }
    }

    async login(token) {
        try {
            await this.client.login(token);
        } catch (error) {
            console.error(`ERRO - Bot não iniciado\n${error}`);
            process.exit(-1)
        }
    }
}