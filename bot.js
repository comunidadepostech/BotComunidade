import {Client, GatewayIntentBits} from "discord.js";

import {PingCommand} from "./commands/ping.js";
import {InviteCommand} from "./commands/invite.js";
import {EchoCommand} from "./commands/echo.js";
import {DisplayCommand} from "./commands/display.js";
import {PollCommand} from "./commands/poll.js";
import {CreateClassCommand} from "./commands/createclass.js";
import {ExtractCommand} from "./commands/extract.js";
import {EventCommand} from "./commands/event.js";
import {DisableCommand} from "./commands/disable.js";
import {UpdateFlagCommand} from "./commands/updateflag.js";
import {ViewFlagsCommand} from "./commands/viewflags.js";

import {MySQLDatabase} from "./database.js";
import Webhook from "./webhooks/webhook.js";
import Scheduler from "./scheduler/scheduler.js";

import {GuildCreate} from "./clientEvents/on/GuildCreate.js";
import {GuildMemberAdd} from "./clientEvents/on/GuildMemberAdd.js";
import {InteractionCreate} from "./clientEvents/on/interactionCreate.js";
import {Debug} from "./clientEvents/on/debug.js";
import {Err} from "./clientEvents/on/error.js";
import {Warning} from "./clientEvents/on/warning.js";
import {ClientReady} from "./clientEvents/once/ClientReady.js";
import {MessageUpdate} from "./clientEvents/on/MessageUpdate.js";
import {MessageCreate} from "./clientEvents/on/MessageCreate.js";

export class Bot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildScheduledEvents,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMessagePolls,
                GatewayIntentBits.GuildMessageReactions
            ],
            rest: {
                timeout: 10000,
                retries: 1
            }
        });
        this.db = this.db = new MySQLDatabase()
        this.commands = [
            new PingCommand(),
            new InviteCommand(this),
            new EchoCommand(this),
            new DisplayCommand(this),
            new PollCommand(),
            new CreateClassCommand(this),
            new ExtractCommand(this),
            new EventCommand(),
            new DisableCommand(),
            new UpdateFlagCommand(this),
            new ViewFlagsCommand(this)
        ]
        this.commands = new Map(this.commands.map(cmd => [cmd.name, cmd]));
        this.defaultFlags = {
            //comandos
            invite: true,
            echo: true,
            display: true,
            poll: true,
            createclass: false,
            extract: true,
            event: true,
            disable: false,

            //eventos
            checkEvents: false,
            getMembers: false,
            saveInteractions: false,
            savePolls: false,
            sendWelcomeMessage: false
        }
        this.flags = {}
        this.events = [
            new GuildCreate(this),
            new GuildMemberAdd(this),
            new ClientReady(),
            new InteractionCreate(this),
            new Debug(),
            new Err(),
            new Warning(),
            new MessageUpdate(this),
            new MessageCreate(this)
        ]
        this.webhook = new Webhook()
        this.scheduler = new Scheduler(this)
    }

    async updateCommandsForGuild(partialGuild) {
        if (!partialGuild) return;

        let guild;
        try {
            guild = await partialGuild.fetch();
        } catch (fetchError) {
            console.error(`ERRO - Falha ao fazer fetch da guild ${partialGuild.id}`, fetchError);
            return;
        }

        // Pega a lista completa de TODOS os comandos
        const allCommands = [...this.commands.values()];

        // Tenta pegar as flags.
        let guildFlags = this.flags[guild.id]; // Tenta pegar do cache

        // Se não existir flags no cache (servidor novo ou DB não lido)
        if (!guildFlags) {
            console.warn(`LOG - Sem flags encontradas para ${guild.name}. Inicializando com padrões...`);

            try {
                // Salva os padrões no DB
                await this.db.saveFlags(guild.id, this.defaultFlags);

                // Atualiza o cache local
                this.flags[guild.id] = this.defaultFlags;

                // Define guildFlags para o resto da função poder usar
                guildFlags = this.defaultFlags;

                console.log(`LOG - Flags padrão salvas para ${guild.name}`);

            } catch (error) {
                console.error(`ERRO - Falha ao inicializar flags no DB para ${guild.name}`, error);
                // Se não conseguir salvar no DB, não registra nada
                await guild.commands.set([]);
                return;
            }
        }


        // Filtra a lista com os comandos ativos pelas flags ou usando os comandos 'alwaysEnabled'
        const enabledCommands = allCommands.filter(command => {
            if (command.alwaysEnabled) {
                return true;
            }
            return guildFlags[command.name] === true;
        });

        // Pega os '.build'
        const enabledBuilds = enabledCommands.map(command => command.build);

        // Registra o array filtrado
        try {
            await guild.commands.set(enabledBuilds);
            console.log(`LOG - Comandos sincronizados para ${guild.name}. (${enabledBuilds.length} registrados)`);
        } catch (err) {
            console.error(
                `ERRO - Falha ao sincronizar comandos para ${guild.name}`,
                err.message || err
            );
        }
    }

    async build(){
        console.log(`LOG - Inicializado com o cliente ${this.client.user.username} de ID ${this.client.user.id}`);

        const guilds = this.client.guilds.cache.values();

        // Cria um array de promessas, uma para cada servidor
        const syncPromises = [...guilds].map(partialGuild => {
            return this.updateCommandsForGuild(partialGuild);
        });

        // Executa todas as sincronizações em paralelo
        await Promise.all(syncPromises).then(() => console.log("LOG - Comandos carregados"));

        // Força o bot a armazenar o cache de cada servidor
        for (let guild of guilds) {
            await guild.fetch();
            await guild.channels.fetch();
            await guild.members.fetch();
            await guild.roles.fetch();
        }

        for (const event of this.events) {
            if (event.once) {
                // Para eventos como 'ClientReady'
                this.client.once(event.name, async (...args) => await event.execute(...args));
            } else {
                // Para eventos como 'InteractionCreate'
                this.client.on(event.name, async (...args) => await event.execute(...args));
            }
        }
        console.log("LOG - Eventos carregados")
    }

    async login(token) {
        try {
            await this.client.login(token);
            console.log(`LOG - Conexão com Discord criada`);
        } catch (error) {
            console.error(`ERRO - Bot não iniciado\n${error}`);
            process.exit(-1)
        }
    }
}