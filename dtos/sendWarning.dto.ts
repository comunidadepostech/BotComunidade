import {Role, TextChannel} from "discord.js";

export default interface sendWarningDTO {
    channel: TextChannel;
    message: string;
    role: Role;
}