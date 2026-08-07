import type { Guild } from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';

export default class GuildDeleteEventController implements IController {
    constructor(private logger: ILoggerService) {}

    async handle(guild: Guild): Promise<void> {
        this.logger.log(`Bot removed from guild: ${guild.name} (${guild.id})`, {
            guildName: guild.name,
            guildId: guild.id,
        });
    }
}
