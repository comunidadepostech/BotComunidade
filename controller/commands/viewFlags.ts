import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";

export class ViewFlagsCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("viewflags")
            .setDescription('Retorna as feature flags do Bot e seus estados no servidor atual')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
        const guildFlags = context.featureFlagsService.getGuildFlags(interaction.guildId!);
        const display = guildFlags ? JSON.stringify(guildFlags, null, 2) : 'Nenhuma flag encontrada para este servidor.';
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: `\`\`\`json\n${display}\`\`\`` });
    }
}