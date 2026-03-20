import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";

export class viewFlagsCommand implements ICommand {
    build() {
        return new SlashCommandBuilder()
            .setName("viewflags")
            .setDescription('Retorna as feature flags do Bot e seus estados no servidor atual')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void | Error> {
        await interaction.reply({flags: MessageFlags.Ephemeral, content: "```json\n" + JSON.stringify(context.featureFlagsService.flags[interaction.guildId!], null, 2) + "```"})
    }
}