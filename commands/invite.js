import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de invite, cria um convite que pode ser vinculado a um cargo e a um canal específico.
export class InviteCommand extends BaseCommand {
    constructor(bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop().replace('.js', ''))
                .setDescription('Cria um convite para o servidor')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal para criar o convite')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Cargo ao qual o convite deve ser vinculado')
                        .setRequired(true)
                )
        )
        this.bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel');
            const role = interaction.options.getRole('role');

            // Cria o convite
            const invite = await channel.createInvite({
                maxAge: 0,
                maxUses: 0,
                duration: 0,
                unique: true
            });

            // Insere o convite no banco de dados e no cache
            await this.bot.db.saveInvite(invite.code, role.id, interaction.guild.id);

            // Responde com o link do convite
            await interaction.reply({
                content: `✅ Convite criado com sucesso!\n📨 Link: ${invite.url}\n📍 Canal: ${channel}\n👥 Cargo vinculado: ${role}`,
                flags: MessageFlags.Ephemeral // Faz a resposta ser visível apenas para quem executou o comando
            });
        } catch (error) {
            await interaction.reply({
                content: `❌ Ocorreu um erro ao criar o convite. Verifique se tenho permissões suficientes.\n` + "```" + error + "```",
                flags: MessageFlags.Ephemeral
            });
            throw new Error("Erro ao criar convite" + error)
        }
    }
}