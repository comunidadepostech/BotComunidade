import {Events} from "discord.js";
import {functionsWithIntervals} from "../../functions/functionsWithIntervals.js";

export class ClientReady {
    constructor(db, commands, defaultFlags, flags) {
        this.name = Events.ClientReady; // O nome do evento
        this.once = true;

        this.db = db;
        this.commands = commands;
        this.defaultFlags = defaultFlags;
        this.flags = flags;
    }

    /**
     * Sincroniza os comandos de um servidor com base nas flags
     * @param {partialGuild} partialGuild - O objeto 'guild' (pode ser parcial)
     */
    async _updateCommandsForGuild(partialGuild) {
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

    async execute(client) {
        console.log(`LOG - Inicializando cliente ${client.user.username} com ID ${client.user.id}`);

        const guilds = await client.guilds.cache;

        // Cria um array de promessas, uma para cada servidor
        const syncPromises = [...guilds.values()].map(partialGuild => {
            return this._updateCommandsForGuild(partialGuild);
        });

        // Executa todas as sincronizações em paralelo
        await Promise.all(syncPromises);

        const functionsWithInterval = new functionsWithIntervals(client, this.db, this.flags)

        setInterval(() => functionsWithInterval.checkEvents(), Number(process.env.EVENT_CHECK_TIME * 60 * 1000));

        // Força o bot a armazenar o cache de cada servidor
        client.guilds.cache.forEach(async (guild) => {
            await guild.channels.fetch();
            await guild.members.fetch();
            await guild.roles.fetch();
        })
    }
}