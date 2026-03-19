import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command, CommandContext} from "../../types/discord.interfaces.ts";
import staticImplements from "../../decorators/staticImplements.ts";

@staticImplements<Command>()
export class disableCommand {
    static build() {
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

    static async execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void | Error> {
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

            const count = await context.discordService.class.disable(role);

            await interaction.editReply({ content: `✅ Cargo removido de ${count} membros da turma ${role.name}.` });
        } catch (error: any) {
            await interaction.editReply({content: `❌ Erro ao desabilitar turma: ${error.message}`});
            console.error(error);
        }
    }
}