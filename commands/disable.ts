import { BaseCommand } from './baseCommand.js';
import {
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    ChatInputCommandInteraction
} from 'discord.js';

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
        const role = await interaction.guild!.roles.fetch(interaction.options.getRole('role')!.id)
        const members = interaction.guild!.members.cache.values();

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        if (!role) return;

        for (const member of members) {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
            }
        }

        await interaction.editReply({content: "✅ Cargo desabilitado com sucesso!"});
    }
}