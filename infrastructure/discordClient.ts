import {Client, GatewayIntentBits} from "discord.js";

export const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
    ],
    rest: {
        timeout: 10000,
        retries: 1
    }
});