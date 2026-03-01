import {
    ChatInputCommandInteraction, Client,
    SlashCommandOptionsOnlyBuilder
} from "discord.js";
import FeatureFlagsService from "../services/FeatureFlagsService.ts";

export type Flag = string;

export interface GuildFlags {
    [key: string]: boolean
}

export type globalFlags = { [key: string]: GuildFlags }

export interface Command {
    name: string;
    build: SlashCommandOptionsOnlyBuilder,
    flag?: Flag
    execute: (interaction: ChatInputCommandInteraction, context: CommandContext) => Promise<void | Error>
}

export interface CommandContext {
    featureFlagsService: FeatureFlagsService;
    client: Client,
    commands: Command[]
}