import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class PingCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName("ping")
                .setDescription('Responde com Pong!')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            { alwaysEnabled: true }
        )
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        await interaction.reply({
            content: "pong!",
            flags: MessageFlags.Ephemeral
        });
    }
}