import { Client, Events } from "discord.js";
import DiscordController from "../controller/discord/discordController.ts";

export default function registerDiscordEvents(client: Client, controller: DiscordController) {
    client.on(Events.ClientReady, (client) => controller.handleClientReadyEvent(client));
    client.on(Events.GuildCreate, (guild) => controller.handleGuildCreateEvent(guild));
    client.on(Events.Error, (error) => controller.handleErrorEvent(error));
    client.on(Events.GuildMemberAdd, (member) => controller.handleGuildMemberAddEvent(member));
    client.on(Events.InteractionCreate, (interaction) => controller.handleInteractionCreateEvent(interaction));
    client.on(Events.MessageCreate, (message) => controller.handleMessageCreateEvent(message));
    client.on(Events.MessageUpdate, (oldMsg, newMsg) => controller.handleMessageUpdateEvent(oldMsg, newMsg));
    client.on(Events.GuildDelete, (guild) => controller.handleGuildDeleteEvent(guild));
}