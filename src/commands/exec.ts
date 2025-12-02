import {BaseCommand} from "./baseCommand.js";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import CheckGuildsEvents from "../scheduler/tasks/checkGuildsEvents.js"
import CountMembersByRole from "../scheduler/tasks/countMemberByRole.js"
import Bot from "../bot.js";
import logger from "../utils/logger.js";

export default class ExecCommand extends BaseCommand {
    readonly #bot: Bot
    constructor(bot: Bot) {
        super (
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.js', ''))
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
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
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
                        await interaction.reply({ content: "❌ Erro ao executar comando", flags: MessageFlags.Ephemeral })
                    })
                    .then(async () => await interaction.reply({ content: "✅ Execução feita!", flags: MessageFlags.Ephemeral }))
                return;
            }
        }

        await interaction.reply({ content: "❌ Comando não encontrado", flags: MessageFlags.Ephemeral })
    }
}