import { Bot } from "../bot.js";
import { GuildCreate } from "./on/GuildCreate.js";
import { GuildMemberAdd } from "./on/GuildMemberAdd.js";
import { ClientReady } from "./once/ClientReady.js";
import { InteractionCreate } from "./on/interactionCreate.js";
import { Err } from "./on/error.js";
import { MessageUpdate } from "./on/MessageUpdate.js";
import { MessageCreate } from "./on/MessageCreate.js";

export const events: Function = (bot: Bot): Array<Object> => [
    new GuildCreate(bot),
    new GuildMemberAdd(bot),
    new ClientReady(),
    new InteractionCreate(bot),
    new Err(),
    new MessageUpdate(bot),
    new MessageCreate(bot)
]