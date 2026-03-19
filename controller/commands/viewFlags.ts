import {Command, CommandContext} from "../../types/discord.interfaces.ts";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import staticImplements from "../../decorators/staticImplements.ts";

@staticImplements<Command>()
export class viewFlagsCommand {
    static build() {
        return new SlashCommandBuilder()
            .setName("viewflags")
            .setDescription('Retorna as feature flags do Bot e seus estados no servidor atual')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    static async execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void | Error> {
        await interaction.reply({flags: MessageFlags.Ephemeral, content: "```json\n" + JSON.stringify(context.featureFlagsService.flags[interaction.guildId!], null, 2) + "```"})
    }
}