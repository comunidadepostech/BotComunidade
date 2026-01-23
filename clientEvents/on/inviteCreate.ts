import Bot from "../../bot.ts";
import {Events, Invite} from "discord.js";

export default class GuildCreate {
    name: string;
    once: boolean;
    bot: Bot;
    constructor(bot: Bot){
        this.name = Events.InviteCreate;
        this.once = false;
        this.bot = bot
    }

    async execute(invite: Invite){
        this.bot.invites.set(invite.guild!.id, this.bot.invites.get(invite.guild!.id)!.set(invite.code, invite.uses!));
    }
}