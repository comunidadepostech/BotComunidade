import {GuildMember, TextChannel} from "discord.js";
export default interface sendWelcomeMEssageDTO {
    targetChannel: TextChannel;
    profile: GuildMember;
}
