import {
    BaseInteraction,
    Client,
    Guild,
    Message,
} from 'discord.js';
import type { IRawPacket } from './discord.interfaces.ts';

export default interface IDiscordController {
    handleGuildCreateEvent(guild: Guild): Promise<void>;
    handleClientReadyEvent(client: Client): Promise<void>;
    handleErrorEvent(error: Error): Promise<void>;
    handleMessageCreateEvent(message: Message): Promise<void>;
    handleInteractionCreateEvent(interaction: BaseInteraction): Promise<void>;
    handleInteractionCreateEvent(interaction: BaseInteraction): Promise<void>;
    handleGuildDeleteEvent(guild: Guild): Promise<void>;
    handleRawEvent(packet: IRawPacket): Promise<void>;
}
