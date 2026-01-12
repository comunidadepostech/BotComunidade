import { BaseCommand } from './baseCommand.ts';
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import logger from "../utils/logger.ts";
import Bot from '../bot.ts';

// Echo serve para replicar uma mensagem para um ou mais canais definidos pelo utilizador
export default class EndPollCommand extends BaseCommand {
    bot: Bot;
    constructor(bot: Bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
                .setDescription("Termina uma enquete instantaneamente")
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("ID da enquete")
                        .setRequired(true)
                        .setMinLength(1)
                ),
            { alwaysEnabled: false }
        );
        this.bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const pollID: string = interaction.options.getString("id", true);

        try {
            const message = await interaction.channel!.messages.fetch(pollID);

            if (!message.poll) logger.error("Enquete não encontrada ou ID inválido.")

            await message.poll!.end();
        } catch (error) {
            logger.error(`Falha ao encerrar enquete ${pollID}:\n${error}`);
            await interaction.editReply({ content: "❌ Ocorreu um erro ao encerrar a enquete. Verifique se o ID está correto e se a enquete ainda está ativa." });
            return;
        }


        await interaction.editReply({
            content: `✅ Enquete encerrada.`,
        });
    }
}
