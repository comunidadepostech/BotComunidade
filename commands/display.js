import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Display serve para exibir os convites ativos do servidor
export class DisplayCommand extends BaseCommand {
    constructor(bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop().replace('.js', ''))
                .setDescription("Exibe os convites ativos do servidor")
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        )
        this.bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        try {
            const rows = await this.bot.db.getAllInvites();

            // Verifica se há convites do banco de dados
            if (rows.length === 0) {
                await interaction.reply({
                    content: "Nenhum convite ativo encontrado.",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // implementar uma forma de atualizar os convites do banco de dados quando o convite não existir mais

            // Formata a resposta com os convites
            let response = "Convites ativos:\n";
            for (let invite of rows) {
                response += `**${interaction.guild.roles.cache.get(invite.role)} --> **https://discord.gg/${invite.invite}\n`;
            }

            await interaction.reply({
                content: response,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(`ERRO - Falha ao buscar convites:`, error);
            await interaction.reply({
                content: "❌ Ocorreu um erro ao buscar os convites.\n"  + "```" + error + "```",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}