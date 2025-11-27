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
// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class UpdateFlagCommand extends BaseCommand {
    constructor(bot) {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription('Desabilita ou habilita uma função do Bot para o servidor atual')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option => option.setName('flag')
            .setDescription('Função a ser desabilitada ou habilitada')
            .setRequired(true))
            .addStringOption(option => option.setName('value')
            .setDescription('Defina true para habilitar ou false para desabilitar')
            .setRequired(true)
            .addChoices({ name: 'true', value: "true" }, { name: 'false', value: 'false' })), { alwaysEnabled: true });
        this.bot = bot;
    }
    // Sobrescreve o execute do BaseCommand
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const guildId = interaction.guild.id;
            const flag = interaction.options.getString('flag');
            const value = interaction.options.getString('value') === "true";
            yield interaction.deferReply({ flags: MessageFlags.Ephemeral });
            // Verificar se as flags da guilda existem
            if (!this.bot.flags[guildId]) {
                yield interaction.reply({ flags: MessageFlags.Ephemeral, content: "Funcionalidades não foram inicializadas para este servidor. Contate um administrador." });
                return;
            }
            // Verificar se a flag específica existe
            if (!(flag in this.bot.flags[guildId])) {
                yield interaction.reply({ flags: MessageFlags.Ephemeral, content: "Funcionalidade não encontrada. Use /viewflags para ver as funcionalidades disponíveis" });
                return;
            }
            this.bot.flags[guildId][flag] = value;
            yield this.bot.db.updateFlag(guildId, flag, value);
            // Recarregar os comandos do servidor após atualizar a flag
            yield this.bot.updateCommandsForGuild(interaction.guild);
            yield interaction.editReply({ flags: MessageFlags.Ephemeral, content: "✅ Funcionalidade atualizada com sucesso!" });
        });
    }
}
