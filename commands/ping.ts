import { BaseCommand } from './baseCommand.ts';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export default class PingCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
                .setDescription('Responde com Pong!')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            { alwaysEnabled: true }
        )
    }

    // Sobrescreve o execute do BaseCommand
    override async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({
            content: "pong!",
            flags: MessageFlags.Ephemeral
        });
    }
}