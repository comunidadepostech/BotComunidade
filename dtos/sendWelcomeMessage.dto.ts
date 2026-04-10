import {GuildMember, TextChannel} from "discord.js";

export default interface SendWelcomeMessageDto {
    targetChannel: TextChannel;
    profile: GuildMember;
}
