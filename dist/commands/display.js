var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BaseCommand } from './baseCommand.js';
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
// Display serve para exibir os convites ativos do servidor
export class DisplayCommand extends BaseCommand {
    constructor(bot) {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription("Exibe os convites ativos do servidor")
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator));
        this.bot = bot;
    }
    // Sobrescreve o execute do BaseCommand
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rows = yield this.bot.db.getAllInvites();
                // Verifica se há convites do banco de dados
                if (rows.length === 0) {
                    yield interaction.reply({
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
                yield interaction.reply({
                    content: response,
                    flags: MessageFlags.Ephemeral
                });
            }
            catch (error) {
                console.error(`ERRO - Falha ao buscar convites:`, error);
                yield interaction.reply({
                    content: "❌ Ocorreu um erro ao buscar os convites.\n" + "```" + error + "```",
                    flags: MessageFlags.Ephemeral
                });
            }
        });
    }
}
