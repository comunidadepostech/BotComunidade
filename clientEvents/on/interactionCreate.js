import { Events, MessageFlags } from "discord.js";

export class InteractionCreate {
    constructor(bot){
        this.name = Events.InteractionCreate;
        this.once = false;
        this.bot = bot
    }

    async execute(interaction){
        if (!interaction.isCommand()) return;

        const command = this.bot.commands.get(interaction.commandName);

        if (!this.bot.flags[interaction.guildId][command.name] && !command.alwaysEnabled) {
            await interaction.reply({ content: "❌ Este comando está desabilitado neste servidor.", flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            await command.execute(interaction);
            console.log(`LOG - Comando ${interaction.commandName} executado por ${interaction.user.username} em ${interaction.guild.name}`)
        } catch (error) {
            console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
        }
    }
}
