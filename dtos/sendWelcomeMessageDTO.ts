import {GuildMember, TextChannel} from "discord.js";
import ILinkedinService from "../types/linkedinService.interface.ts";
export default interface sendWelcomeMessageDTO {
    targetChannel: TextChannel;
    profile: GuildMember;
    linkedinService: ILinkedinService
}
