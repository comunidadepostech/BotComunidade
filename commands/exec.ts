import {BaseCommand} from "./baseCommand.ts";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import CheckGuildsEvents from "../scheduler/tasks/checkGuildsEvents.ts"
import CountMembersByRole from "../scheduler/tasks/countMemberByRole.ts"
import Bot from "../bot.ts";
import logger from "../utils/logger.ts";

export default class ExecCommand extends BaseCommand {
    readonly #bot: Bot
    constructor(bot: Bot) {
        super (
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
                .setDescription('Executa um comando do scheduler')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(option =>
                    option.setName('comando')
                        .setDescription('Qual comando deve ser executado')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Checagem de eventos do servidor', value: CheckGuildsEvents.name},
                            {name: 'Contagem de membros', value: CountMembersByRole.name}
                        )
                ),
            { alwaysEnabled: false }
        )
        this.#bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        const command: string = interaction.options.getString('comando')!;

        const avaliableComands = [
            new CheckGuildsEvents(this.#bot),
            new CountMembersByRole(this.#bot, true)
        ]

        for (const avaliableCommand of avaliableComands) {
            if (avaliableCommand.constructor.name === command) {
                await avaliableCommand.execute()
                    .catch(async (error: any) => {
                        logger.error(`Erro ao executar ${avaliableCommand.constructor.name} através de /exec: ${error}`)
                        await interaction.editReply({ content: "❌ Erro ao executar comando" })
                    })
                    .then(async () => await interaction.editReply({ content: "✅ Execução feita!" }))
                return;
            }
        }

        await interaction.reply({ content: "❌ Comando não encontrado", flags: MessageFlags.Ephemeral })
    }
}