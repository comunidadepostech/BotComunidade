import {Events} from "discord.js";

export class GuildCreate {
    constructor(db, flags, defaultFlags){
        this.name = Events.GuildCreate; // O nome do evento
        this.once = false;

        this._db = db;
        this.flags = flags
        this.defaultFlags = defaultFlags
    }

    async execute(client, guild){
        console.info(`LOG - ${client.user.username} adicionado ao servidor ${guild.name} com ID ${guild.id}`);

        // await guild.commands.set(slashCommands.map(c => c.commandBuild));
        // console.log(`LOG - Comandos registrados em ${guild.name}`);

        this.flags[guild.id] = this.defaultFlags
        await this._db.getFlags(guild.id)
        console.log(`LOG - Flags do servidor ${guild.name} carregadas`);
    }
}