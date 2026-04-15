import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";

export class DisableCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("disable")
            .setDescription('Desabilita uma turma removendo o cargo da turma dos alunos')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('Cargo a ser desabilitado')
                    .setRequired(true)
            )
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
        if (!context.featureFlagsService.getFlag(interaction.guildId!, "comando_disable")) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const roleId = interaction.options.getRole('role')!.id;
        const role = await interaction.guild!.roles.fetch(roleId);

        if (!role) {
            await interaction.editReply({content: `❌ Erro ao desabilitar turma: O cargo da turma não foi encontrado.`});
            return;
        }

        try {
            const fetchedMembers = await interaction.guild!.members.fetch();

            const membersWithRole = fetchedMembers.filter(member => member.roles.cache.has(role.id)).values().toArray();

            if (membersWithRole.length === 0) {
                await interaction.editReply({ content: `⚠️ Nenhum membro possui o cargo ${role.name}.` });
                return;
            }

            await context.discordService.class.disable(role);

            await interaction.editReply({ content: `✅ Cargo da turma ${role.name} desabilitado.` });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido"
            await interaction.editReply({content: `❌ Erro ao desabilitar turma: ${message}`});
            console.error(error);
        }
    }
}