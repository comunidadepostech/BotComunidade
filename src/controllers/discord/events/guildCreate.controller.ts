import type { Guild } from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';
import type IGuildService from '../../../types/services/guildService.interface';

export default class GuildCreateEventController implements IController {
    constructor(
        private guildService: IGuildService,
        private logger: ILoggerService,
    ) {}

    async handle(guild: Guild): Promise<void> {
        this.logger.warn(
            `Bot added to new guild: ${guild.name} (${guild.id}), set the clusters and the guild abbreviation in the database!`,
            {
                guildName: guild.name,
                guildId: guild.id,
            },
        );

        await this.guildService.saveNewGuild(guild.id);
    }
}
