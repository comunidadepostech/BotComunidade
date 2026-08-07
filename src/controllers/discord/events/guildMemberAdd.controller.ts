import type IController from '../../../types/interfaces/controller.interface';
import type { GuildMember } from 'discord.js';
import type ILoggerService from '../../../types/services/loggerService.interface';
import type IMessageService from '../../../types/services/messageService.interface';
import { WELCOME_CHANNEL_NAME } from '../../../utils/constants/discordConstants';
import type IFeatureFlagsService from '../../../types/services/featureFlagsService.interface';

export default class GuildMemberAddEventController implements IController {
    constructor(
        private logger: ILoggerService,
        private messageService: IMessageService,
        private flagsService: IFeatureFlagsService
    ) {}

    async handle(member: GuildMember): Promise<void> {
        if (!this.flagsService.isEnabled(member.guild.id, 'enviar_mensagem_de_boas_vindas')) return;
        
        const memberName = member.user.displayName;

        this.logger.log(`New member joined: ${memberName} (${member.id})`, {
            memberName,
            memberId: member.id,
        });

        const guildChannels = await member.guild.channels.fetch();
        const welcomeChannel = guildChannels.find((channel) => channel?.name === WELCOME_CHANNEL_NAME);

        if (!welcomeChannel) {
            this.logger.error(`Failed to find welcome channel for guild: ${member.guild.id}`, {
                guildName: member.guild.name,
                guildId: member.guild.id,
            });
            return;
        }

        const welcomeChannelPayload = {
            id: welcomeChannel.id,
            name: welcomeChannel.name,
            guild: { id: member.guild.id, name: member.guild.name },
        };

        await this.messageService.sendWelcomeMessage({
            channel: welcomeChannelPayload,
            memberName,
            memberId: member.id,
            memberAvatarURL: member.user.displayAvatarURL({ extension: 'png', size: 512 }),
        });
    }
}
