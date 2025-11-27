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
import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class DisableCommand extends BaseCommand {
    constructor() {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription('Desabilita um cargo (remove todas as permissões)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addRoleOption(option => option.setName('role')
            .setDescription('Cargo a ser desabilitado')
            .setRequired(true)));
    }
    // Sobrescreve o execute do BaseCommand
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const role = interaction.options.getRole('role');
            const channels = yield interaction.guild.channels.cache;
            yield interaction.deferReply({ flags: MessageFlags.Ephemeral });
            for (const channel of channels.values()) {
                const roleNameWithoutPrefix = role.name.replace("Estudantes ", "");
                const shouldDisable = (channel.type === ChannelType.GuildCategory && ["Alun", "Pós Tech", roleNameWithoutPrefix].includes(channel.name)) ||
                    (["🎥│gravações", "🚨│avisos"].includes(channel.name) && ((_a = channel.parent) === null || _a === void 0 ? void 0 : _a.name) === roleNameWithoutPrefix) ||
                    (channel.name.includes("faq"));
                if (shouldDisable) {
                    const permissionsToDisable = {
                        [PermissionFlagsBits.SendMessages]: false,
                        [PermissionFlagsBits.ViewChannel]: false,
                        [PermissionFlagsBits.ReadMessageHistory]: false,
                        [PermissionFlagsBits.AddReactions]: false
                    };
                    yield channel.permissionOverwrites.edit(role.id, permissionsToDisable);
                }
            }
            yield interaction.guild.roles.edit(role.id, {
                [PermissionFlagsBits.SendMessages]: false,
                [PermissionFlagsBits.ViewChannel]: false,
                [PermissionFlagsBits.ReadMessageHistory]: false,
                [PermissionFlagsBits.AddReactions]: false
            });
            yield interaction.editReply({ flags: MessageFlags.Ephemeral, content: "✅ Cargo desabilitado com sucesso!" });
        });
    }
}
