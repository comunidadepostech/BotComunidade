import { Events, MessageFlags, ChatInputCommandInteraction } from "discord.js";
import logger from "../../utils/logger.js";
import Bot from "../../bot.js";

export default class InteractionCreate {
    name: string;
    once: boolean;
    bot: Bot;
    constructor(bot: Bot){
        this.name = Events.InteractionCreate;
        this.once = false;
        this.bot = bot
    }

    async execute(interaction: ChatInputCommandInteraction){
        if (!interaction.isCommand()) return;

        const command = this.bot.commands.get(interaction.commandName);

        if (!this.bot.flags[interaction.guildId!][command!.name] && !command!.alwaysEnabled) {
            await interaction.reply({ content: "❌ Este comando está desabilitado neste servidor.", flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            await command!.execute(interaction);
            logger.command(`Comando ${interaction.commandName} executado por ${interaction.user.username} em ${interaction.guild!.name}`)
        } catch (error) {
            logger.error(`Erro ao executar o comando ${interaction.commandName}: ${error}`);
        }
    }
}
