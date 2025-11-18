import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class UpdateFlagCommand extends BaseCommand {
    constructor(db, flags) {
        super(
            new SlashCommandBuilder()
                .setName('updateflag')
                .setDescription('Desabilita ou habilita uma função do Bot para o servidor atual')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(option =>
                    option.setName('flag')
                        .setDescription('Função a ser desabilitada ou habilitada')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('Defina true para habilitar ou false para desabilitar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'true', value: "true" },
                            { name: 'false', value: 'false' }
                        )
                ),
            { alwaysEnabled: true }
        )
        this._db = db
        this.flags = flags
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const flag = interaction.options.getString('flag');
        const value = interaction.options.getString('value') === "true";

        await interaction.deferReply({flags: MessageFlags.Ephemeral})

        // Verificar se as flags da guilda existem
        if (!this.flags[guildId]) {
            await interaction.reply({flags: MessageFlags.Ephemeral, content: "Funcionalidades não foram inicializadas para este servidor. Contate um administrador."})
            return;
        }

        // Verificar se a flag específica existe
        if (!(flag in this.flags[guildId])) {
            await interaction.reply({flags: MessageFlags.Ephemeral, content: "Funcionalidade não encontrada. Use /viewflags para ver as funcionalidades disponíveis"})
            return;
        }

        this.flags[guildId][flag] = value;
        await this._db.updateFlag(guildId, flag, value);

        // Recarregar os comandos do servidor após atualizar a flag
        const clientReady = interaction.client._clientReadyInstance;
        if (clientReady) {
            await clientReady._updateCommandsForGuild(interaction.guild);
        }

        await interaction.editReply({flags: MessageFlags.Ephemeral, content: "✅ Funcionalidade atualizada com sucesso!"});
    }
}