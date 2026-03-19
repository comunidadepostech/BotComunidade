import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command} from "../../types/discord.interfaces.ts";
import staticImplements from "../../decorators/staticImplements.ts";

@staticImplements<Command>()
export class pingCommand {
    static build() {
        return new SlashCommandBuilder()
            .setName("ping")
            .setDescription('Responde com Pong!')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    static async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({content: "pong!", flags: MessageFlags.Ephemeral});
    }
}