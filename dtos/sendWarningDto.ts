import {Role, TextChannel} from "discord.js";

export default interface SendWarningDto {
    channel: TextChannel;
    message: string;
    role: Role;
}