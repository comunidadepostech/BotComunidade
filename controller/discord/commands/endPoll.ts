import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command} from "../../../entities/discordEntities.ts";

export const endPollCommand: Command = {
    name: 'endpoll',
    build: new SlashCommandBuilder()
        .setName("endpoll")
        .setDescription("Termina uma enquete instantaneamente")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("id")
                .setDescription("ID da enquete")
                .setRequired(true)
                .setMinLength(1)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const message = await interaction.channel!.messages.fetch(interaction.options.getString("id", true));

        if (!message.poll) {
            await interaction.reply({content: "Enquete não encotrada", flags: MessageFlags.Ephemeral});
            console.error("❌ Enquete não encontrada ou já terminou")
            return
        }

        await message.poll!.end();

        await interaction.reply({content: `✅ Enquete encerrada.`, flags: MessageFlags.Ephemeral});
    }
}