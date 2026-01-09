import { BaseCommand } from './baseCommand.js';
import {ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export default class DisableCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
                .setDescription('Desabilita um cargo (remove todas as permissões)')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Cargo a ser desabilitado')
                        .setRequired(true)
                ),
            { alwaysEnabled: false }
        )
    }

    // Sobrescreve o execute do BaseCommand
    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const role = interaction.options.getRole('role')!;
        const channels = interaction.guild!.channels.cache.values();

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        for (const channel of channels) {
            const roleNameWithoutPrefix = role.name.replace("Estudantes ", "");
            const shouldDisable = (channel.type === ChannelType.GuildCategory && ["Alun", "Pós Tech", roleNameWithoutPrefix].includes(channel.name)) ||
                (["🎥│gravações", "🚨│avisos"].includes(channel.name) && channel.parent?.name === roleNameWithoutPrefix) ||
                (channel.name.includes("faq"));

            if (shouldDisable) {
                const permissionsToDisable = {
                    [PermissionFlagsBits.SendMessages as unknown as string]: false,
                    [PermissionFlagsBits.ViewChannel as unknown as string]: false,
                    [PermissionFlagsBits.ReadMessageHistory as unknown as string]: false,
                    [PermissionFlagsBits.AddReactions as unknown as string]: false
                };
                if ('permissionOverwrites' in channel) await channel.permissionOverwrites.edit(role.id, permissionsToDisable);
            }
        }

        await interaction.guild!.roles.edit(
            role.id,
            {
                [PermissionFlagsBits.SendMessages as unknown as string]: false,
                [PermissionFlagsBits.ViewChannel as unknown as string]: false,
                [PermissionFlagsBits.ReadMessageHistory as unknown as string]: false,
                [PermissionFlagsBits.AddReactions as unknown as string]: false
            }
        )

        await interaction.editReply({content: "✅ Cargo desabilitado com sucesso!"});
    }
}