import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type ICommand from '../../../types/interfaces/command.interface.ts';
import type IController from '../../../types/interfaces/controller.interface.ts';

export default class PingCommand implements ICommand, IController {
    constructor() {}
    
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Responde com Pong!')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({ content: 'pong!', flags: MessageFlags.Ephemeral });
    }
}
