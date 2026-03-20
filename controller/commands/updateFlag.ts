import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";

export class updateFlagCommand implements ICommand {
    build() {
        return new SlashCommandBuilder()
            .setName("updateflag")
            .setDescription('Permite alterar o estádo de uma feature flag do Bot.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option => option.setName("flag").setDescription("Nome da feature flag").setRequired(true))
            .addBooleanOption(option => option.setName("value").setDescription("Novo estado da feature flag").setRequired(true))
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void | Error> {
        let flagname: string | string[] = interaction.options.getString("flag", true)

        if (flagname.includes(";")) {
            flagname = flagname.split(";")
        }

        try {
            await context.featureFlagsService.updateFlag({
                guildId: interaction.guildId!,
                flagName: flagname,
                flagValue: interaction.options.getBoolean("value", true),
                featureFlagsService: context.featureFlagsService,
            })

            const formattedFlagName = Array.isArray(flagname) ? flagname.join(", ") : flagname;

            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: `✅ A flag **${formattedFlagName}** foi atualizada com sucesso para \`${interaction.options.getBoolean("value", true)}\`!`
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido"
            await interaction.reply({flags: MessageFlags.Ephemeral, content: `❌ Erro ao atualizar flag: ${message}`});
        }
    }
}