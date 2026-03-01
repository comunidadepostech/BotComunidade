import {Command, CommandContext} from "../../../entities/discordEntities.ts";
import {ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import updateFlag from "../../../services/commandsServices/updateFlag.ts";
import {UpdateFeatureFlagDTO} from "../../../entities/dto/updateFlagDTO.ts";

export const updateFlagCommand: Command = {
    name: "updateflag",
    build: new SlashCommandBuilder()
        .setName("updateflag")
        .setDescription('Permite alterar o estádo de uma feature flag do Bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option.setName("flag").setDescription("Nome da feature flag").setRequired(true))
    .addBooleanOption(option => option.setName("value").setDescription("Novo estado da feature flag").setRequired(true)),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        let flagname: string | string[] = interaction.options.getString("flag", true)

        if (flagname.includes(";")) {
            flagname = flagname.split(";")
        }

        const dto: UpdateFeatureFlagDTO = {
            guildId: interaction.guildId!,
            flagName: flagname,
            flagValue: interaction.options.getBoolean("value", true),
            featureFlagsService: context.featureFlagsService,
        };

        try {
            await updateFlag(dto, context.featureFlagsService)

            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: `Flag atualizada!\n\`\`\`json\n${JSON.stringify(context.featureFlagsService.flags, null, 2)}\n\`\`\``
            });
        } catch (error: any) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: `❌ Erro ao atualizar flag: ${error.message}`
            });
        }
    }
}