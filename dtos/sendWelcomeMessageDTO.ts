import {GuildMember, TextChannel} from "discord.js";

export default interface SendWelcomeMessageDTO {
    targetChannel: TextChannel;
    profile: GuildMember;
}
