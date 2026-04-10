import type {ICommand} from "../../types/discord.interfaces.ts";
import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageFlags,
    MessageContextMenuCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from "discord.js";
import type {ModalActionRowComponentBuilder} from "discord.js";
import type {ICommandContext} from "../../types/discord.interfaces.ts";

export class EditCommand implements ICommand{
    build(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setName('Editar mensagem')
            .setType(ApplicationCommandType.Message)
    }

    async execute(interaction: MessageContextMenuCommandInteraction, context: ICommandContext): Promise<void> {
        const targetMessage = interaction.targetMessage;

        if (targetMessage.author.id !== context.client.user!.id) {
            await interaction.reply({content: "❌ Essa mensagem não pertence ao bot.", flags: MessageFlags.Ephemeral});
            return;
        }

        if (!targetMessage.content) {
            await interaction.reply({content: "❌ Esta mensagem não possui texto simples para ser editado.", flags: MessageFlags.Ephemeral});
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId(`edit_modal_${targetMessage.id}`)
            .setTitle('Editar Mensagem');

        const textInput = new TextInputBuilder()
            .setCustomId('edited_content')
            .setLabel('Edite o texto abaixo:')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(targetMessage.content)
            .setMaxLength(2000)
            .setRequired(true);

        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(textInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

        try {
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: (i) => i.customId === `edit_modal_${targetMessage.id}` && i.user.id === interaction.user.id,
                time: 300_000
            });

            const newContent = modalSubmit.fields.getTextInputValue('edited_content');

            await targetMessage.edit({ content: newContent });

            await modalSubmit.reply({content: `✅ Mensagem editada com sucesso.`, flags: MessageFlags.Ephemeral});

        } catch {
            console.warn("Edição de mensagem cancelada ou tempo esgotado.");
        }
    }
}