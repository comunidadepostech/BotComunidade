import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder,
    OAuth2Scopes,
} from 'discord.js';
import type ICommand from '../../../types/interfaces/command.interface.ts';
import type IController from '../../../types/interfaces/controller.interface.ts';

export default class InviteCommand implements ICommand, IController {
    constructor() {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('invite')
            .setDescription('Gera um invite para convidar o bot para um servidor novo')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({
            content: interaction.client.generateInvite({
                permissions: [PermissionFlagsBits.Administrator],
                scopes: [OAuth2Scopes.Bot],
            }),
            flags: MessageFlags.Ephemeral,
        });
    }
}
