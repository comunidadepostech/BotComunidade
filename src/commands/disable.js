import { BaseCommand } from './baseCommand.js';
import {ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class DisableCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop().replace('.js', ''))
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

        for (const channel of channels.values()) {
            const roleNameWithoutPrefix = role.name.replace("Estudantes ", "");
            const shouldDisable = (channel.type === ChannelType.GuildCategory && ["Alun", "Pós Tech", roleNameWithoutPrefix].includes(channel.name)) ||
                (["🎥│gravações", "🚨│avisos"].includes(channel.name) && channel.parent?.name === roleNameWithoutPrefix) ||
                (channel.name.includes("faq"));

            if (shouldDisable) {
                const permissionsToDisable = {
                    [PermissionFlagsBits.SendMessages]: false,
                    [PermissionFlagsBits.ViewChannel]: false,
                    [PermissionFlagsBits.ReadMessageHistory]: false,
                    [PermissionFlagsBits.AddReactions]: false
                };
                await channel.permissionOverwrites.edit(role.id, permissionsToDisable);
            }
        }

        await interaction.guild.roles.edit(
            role.id,
            {
                [PermissionFlagsBits.SendMessages]: false,
                [PermissionFlagsBits.ViewChannel]: false,
                [PermissionFlagsBits.ReadMessageHistory]: false,
                [PermissionFlagsBits.AddReactions]: false
            }
        )

        await interaction.editReply({flags: MessageFlags.Ephemeral, content: "✅ Cargo desabilitado com sucesso!"});
    }
}