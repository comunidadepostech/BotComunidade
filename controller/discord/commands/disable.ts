import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import ClassService from "../../../services/classService.ts";
import {Command} from "../../../entities/discordEntities.ts";

export const disableCommand: Command = {
    name: "disable",
    flag: "comando_disable",
    build: new SlashCommandBuilder()
        .setName("disable")
        .setDescription('Desabilita uma turma removendo o cargo da turma dos alunos')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Cargo a ser desabilitado')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        if (!context.featureFlagsService.flags[interaction.guildId!]!["comando_disable"]) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }

        const role = await interaction.guild!.roles.fetch(interaction.options.getRole('role')!.id)
        const members = interaction.guild!.members.cache.values().toArray();

        if (!role) {
            await interaction.reply({content: `❌ Erro ao desabilitar turma: O cargo da turma não foi encontrado.`, flags: MessageFlags.Ephemeral});
            return
        }

        try {
            await ClassService.disable(members, role)
            await interaction.reply({ content: `✅ Cargo removido dos membros da turma ${role.name}.` });
        } catch (error: any) {
            await interaction.reply({content: `❌ Erro ao desabilitar turma: ${error.message}`, flags: MessageFlags.Ephemeral});
            console.error(error);
        }
    }
}