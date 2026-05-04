import type {ICommand, ICommandContext} from "../../types/discord.interfaces";
import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    type MessageContextMenuCommandInteraction,
    MessageFlags
} from "discord.js";
import generatePollHash from "../../utils/generatePollHash.ts";

export class GetPollHash implements ICommand {
    build(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setName('Obter hash dessa enquete')
            .setType(ApplicationCommandType.Message)
    }

    async execute(interaction: MessageContextMenuCommandInteraction, context: ICommandContext): Promise<void> {
        if (!interaction.targetMessage.poll) {
            await interaction.reply({content: "❌ A mensagem selecionada não contém uma enquete.", flags: MessageFlags.Ephemeral});
            return
        }

        if (interaction.targetMessage.author.id !== context.client.user!.id) {
            await interaction.reply({content: `❌ Essa enquete não foi criada pelo bot.`, flags: MessageFlags.Ephemeral});
            return
        }

        if (!interaction.targetMessage.poll.resultsFinalized) {
            await interaction.reply({content: `❌ Essa enquete ainda não foi finalizada.`, flags: MessageFlags.Ephemeral});
            return
        }

        const hash = generatePollHash(interaction.targetMessage.createdAt.getFullYear().toString(), interaction.targetMessage.createdAt.getMonth().toString(), interaction.targetMessage.content)

        await interaction.reply({content: "Hash da enquete: " + hash, flags: MessageFlags.Ephemeral});
    }
}