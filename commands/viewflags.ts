import { BaseCommand } from './baseCommand.ts';
import {ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';
import Bot from '../bot.ts';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export default class ViewFlagsCommand extends BaseCommand {
    readonly bot: Bot;
    constructor(bot: Bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
                .setDescription('Retorna as funções do Bot e seus estados para o servidor atual')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            { alwaysEnabled: true }
        )
        this.bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    override async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({flags: MessageFlags.Ephemeral, content: "```py\n" + JSON.stringify(this.bot.flags[interaction.guildId!], null, 2) + "```"});
    }
}