import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class ViewFlagsCommand extends BaseCommand {
    constructor(bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop().replace('.js', ''))
                .setDescription('Retorna as funções do Bot e seus estados para o servidor atual')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            { alwaysEnabled: true }
        )
        this.bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        await interaction.reply({flags: MessageFlags.Ephemeral, content: "```py\n" + JSON.stringify(this.bot.flags, null, 2) + "```"});
    }
}