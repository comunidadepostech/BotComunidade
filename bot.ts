import { Client, GatewayIntentBits, Guild, ClientEvents, Partials, Options } from "discord.js";

import { MySQLDatabase } from "./database.js";
import Webhook from "./webhooks/webhook.js";
import Scheduler from "./scheduler/scheduler.js";
import logger from "./utils/logger.js";

import { events } from "./clientEvents/events.js";
import { commands } from "./commands/commands.js";
import { BaseCommand } from "./commands/baseCommand.js";


export default class Bot {
    public client: Client;
    public db: MySQLDatabase;
    public commands: Map<string, BaseCommand>;
    public defaultFlags: Record<string, boolean>;
    public flags: any;
    public events: Array<any>;
    public webhook: Webhook;
    public scheduler: Scheduler;
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
            },
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction
            ],
            makeCache: Options.cacheWithLimits({
                ...Options.DefaultMakeCacheSettings,
                MessageManager: 20000,
            })
        });
        this.db = new MySQLDatabase()
        this.commands = new Map(commands(this).map((cmd: BaseCommand) => [cmd.name, cmd]));
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
            exec: false,
            endpoll: true,

            //eventos
            checkEvents: false,
            saveMembers: false,
            saveInteractions: false,
            savePolls: false,
            sendWelcomeMessage: false,
            sendLiveForms: false
        }
        this.flags = {}
        this.events = events(this)
        this.webhook = new Webhook()
        this.scheduler = new Scheduler(this)
    }



    async updateCommandsForGuild(partialGuild: Guild) {
        if (!partialGuild) return;

        let guild;
        try {
            guild = await partialGuild.fetch();
        } catch (fetchError) {
            logger.error(`Falha ao fazer fetch da guild ${partialGuild.id}\n${fetchError}`);
            return;
        }

        // Pega a lista completa de TODOS os comandos
        const allCommands = [...this.commands.values()];

        // Tenta pegar as flags.
        let guildFlags: Record<string, boolean> = this.flags[guild.id]; // Tenta pegar do cache

        // Se não existir flags no cache (servidor novo ou DB não lido)
        if (!guildFlags) {
            logger.warn(`Sem flags encontradas para ${guild.name}. Inicializando com padrões...`);

            try {
                // Salva os padrões no DB
                await this.db.saveFlags(guild.id, this.defaultFlags);

                // Atualiza o cache local
                this.flags[guild.id] = this.defaultFlags; 

                // Define guildFlags para o resto da função poder usar
                guildFlags = this.defaultFlags;

                logger.log(`Flags padrão salvas para ${guild.name}`);

            } catch (error) {
                logger.error(`Falha ao inicializar flags no DB para ${guild.name}\n${error}`);
                // Se não conseguir salvar no DB, não registra nada
                await guild.commands.set([]);
                return;
            }
        }

        // Filtra a lista com os comandos ativos pelas flags ou usando os comandos 'alwaysEnabled'
        const enabledCommands = allCommands.filter((command: BaseCommand) => {
            if (command.alwaysEnabled) {
                return true;
            }
            return guildFlags[command.name];
        });

        // Pega os '.build'
        const enabledBuilds = enabledCommands.map(command => command.build);

        // Registra o array filtrado
        try {
            await guild.commands.set(enabledBuilds);
            logger.log(`Comandos sincronizados para ${guild.name}. (${enabledBuilds.length} registrados)`);
        } catch (err) {
            logger.error(`Falha ao sincronizar comandos para ${guild.name}` + err);
        }
    }

    clearCommands(): void {
        this.client.guilds.cache.forEach(guild => guild.commands.set([]));
    }

    async build() {
        logger.log(`Inicializado com o cliente ${this.client.user?.username} de ID ${this.client.user?.id}`);

        const guilds = this.client.guilds.cache.values();

        // Cria um array de promessas, uma para cada servidor
        const syncPromises = [...guilds].map(partialGuild => {
            return this.updateCommandsForGuild(partialGuild);
        });

        // Executa todas as sincronizações em paralelo
        await Promise.all(syncPromises).then(() => logger.log("Comandos carregados"));

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
                this.client.once(event.name, async (...args: ClientEvents[]) => {
                    try {
                        await event.execute(...args)
                    } catch (error: any) {
                        logger.error(error as string)
                    }

                })
            } else {
                // Para eventos como 'InteractionCreate'
                this.client.on(event.name, async (...args: ClientEvents[]) => {
                    try {
                        await event.execute(...args)
                    } catch (error: any) {
                        logger.error(error as string)
                    }
                });
            }
        }
        logger.log("Eventos carregados")
    }

    async login(token: string) {
        try {
            await this.client.login(token);
            logger.log(`Conexão com Discord criada`);
        } catch (error) {
            logger.error(`Bot não iniciado\n${error}`);
            process.exit(-1)
        }
    }
}