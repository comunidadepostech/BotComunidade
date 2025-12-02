import { SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction } from "discord.js";
export class BaseCommand {
    name: string;
    build: SlashCommandOptionsOnlyBuilder;
    alwaysEnabled: boolean;

    constructor(build: SlashCommandOptionsOnlyBuilder, options: { alwaysEnabled?: boolean }) {
        if (!build) {
            throw new Error("Um comando deve ter uma construção.");
        }

        this.name = build.name;
        this.build = build
        this.alwaysEnabled = options.alwaysEnabled || false;
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply("Comando vazio")
        throw new Error(`O comando ${this.name} precisa de um método execute()!`);
    }
}