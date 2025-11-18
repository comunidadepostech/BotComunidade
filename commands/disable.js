import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class DisableCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('disable')
                .setDescription('Desabilita um cargo (remove todas as permissões)')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Cargo a ser desabilitado')
                        .setRequired(true)
                )
        )
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const channels = await interaction.guild.channels.cache;

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        for (const [_, channel] of channels) {
            if (channel.type === 4 && ["Alun", "Pós Tech", role.name.replace("Estudantes ", "")].includes(channel.name)) {
                await channel.permissionOverwrites.edit(role.id, {
                    SendMessages: false,
                    ViewChannel: false,
                    ReadMessageHistory: false,
                    AddReactions: false
                });
            }

            if (["🎥│gravações", "🚨│avisos"].includes(channel.name) && channel.parent?.name === role.name.replace("Estudantes ", "")) {
                await channel.permissionOverwrites.edit(role.id, {
                    SendMessages: false,
                    ViewChannel: false,
                    ReadMessageHistory: false,
                    AddReactions: false
                });
            }
        }

        await interaction.editReply({flags: MessageFlags.Ephemeral, content: "✅ Cargo desabilitado com sucesso!"});
    }
}