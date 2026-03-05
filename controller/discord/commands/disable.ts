import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import ClassService from "../../../services/classService.ts";
import {Command, CommandContext} from "../../../entities/discordEntities.ts";

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

            const count = await ClassService.disable(membersWithRole, role);

            await interaction.editReply({ content: `✅ Cargo removido de ${count} membros da turma ${role.name}.` });
        } catch (error: any) {
            await interaction.editReply({content: `❌ Erro ao desabilitar turma: ${error.message}`});
            console.error(error);
        }
    }
}