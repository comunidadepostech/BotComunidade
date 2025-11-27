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
export class PingCommand extends BaseCommand {
    constructor() {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription('Responde com Pong!')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), { alwaysEnabled: true });
    }
    // Sobrescreve o execute do BaseCommand
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield interaction.reply({
                content: "pong!",
                flags: MessageFlags.Ephemeral
            });
        });
    }
}
