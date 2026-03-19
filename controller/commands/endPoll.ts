import {Command} from "../../types/discord.interfaces.ts";
import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageFlags,
    MessageContextMenuCommandInteraction
} from "discord.js";
import staticImplements from "../../decorators/staticImplements.ts";
import {CommandContext} from "../../types/discord.interfaces.ts";

@staticImplements<Command>()
export class endPollCommand {
    static build() {
        return new ContextMenuCommandBuilder()
            .setName('Encerrar enquete')
            .setType(ApplicationCommandType.Message)
    }

    static async execute(interaction: MessageContextMenuCommandInteraction, context: CommandContext): Promise<void | Error> {
        if (!interaction.targetMessage.poll) {
            await interaction.reply({content: "❌ A mensagem selecionada não contém uma enquete.", flags: MessageFlags.Ephemeral});
            return
        }

        if (interaction.targetMessage.author.id !== context.client.user!.id) {
            await interaction.reply({content: `❌ Essa enquete não foi criada pelo bot.`, flags: MessageFlags.Ephemeral});
            return
        }

        if (interaction.targetMessage.poll.resultsFinalized) {
            await interaction.reply({content: `❌ Essa enquete já foi finalizada.`, flags: MessageFlags.Ephemeral});
            return
        }

        await interaction.targetMessage.poll.end();

        await interaction.reply({content: `✅ Enquete encerrada.`, flags: MessageFlags.Ephemeral});
    }
}