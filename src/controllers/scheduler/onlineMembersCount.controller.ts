import { Routes, type APIGuild, type Client } from 'discord.js';
import type IController from '../../types/interfaces/controller.interface';
import type IMemberService from '../../types/services/memberService.interface';

export default class OnlineMembersCountController implements IController {
    constructor(
        private memberService: IMemberService,
        private client: Client,
    ) {}

    async handle() {
        const oauthGuilds = await this.client.guilds.fetch();
        let totalOnlineCount = 0;

        for (const oauthGuild of oauthGuilds.values()) {
            const rawGuild = (await this.client.rest.get(Routes.guild(oauthGuild.id), {
                query: new URLSearchParams({ with_counts: 'true' }),
            })) as APIGuild;

            totalOnlineCount += rawGuild.approximate_presence_count ?? 0;
        }

        await this.memberService.saveOnlineMembers(totalOnlineCount);
    }
}
