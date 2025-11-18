import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class ViewFlagsCommand extends BaseCommand {
    constructor(flags) {
        super(
            new SlashCommandBuilder()
                .setName('viewflags')
                .setDescription('Retorna as funções do Bot e seus estados para o servidor atual')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            { alwaysEnabled: true }
        )
        this.flags = flags
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        await interaction.reply({flags: MessageFlags.Ephemeral, content: "```" + JSON.stringify(this.flags, null, 2) + "```"});
    }
}