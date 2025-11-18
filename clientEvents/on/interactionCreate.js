// javascript
import { Events, MessageFlags } from "discord.js";

export class InteractionCreate {
    constructor(commands, flags){
        this.name = Events.InteractionCreate;
        this.once = false;
        this.commands = commands;
        this.flags = flags;
    }

    async execute(client, interaction){
        if (!interaction.isCommand()) return;

        const command = this.commands.get(interaction.commandName);

        if (!this.flags[interaction.guildId][command.name] && !command.alwaysEnabled) {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "❌ Este comando está desabilitado neste servidor.", flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply({ content: "❌ Este comando está desabilitado neste servidor." });
            }
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
