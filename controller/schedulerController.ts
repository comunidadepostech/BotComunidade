import {Client, Collection, Guild, GuildMember, Role} from "discord.js";
import FeatureFlagsService from "../services/FeatureFlagsService.ts";
import RolesService from "../services/rolesService.ts";

export class SchedulerController {
    static handleEventVerification() {

    }

    static async handleMembersCount(client: Client, featureFlagsService: FeatureFlagsService) {


        for (const guild of client.guilds.cache.values()) {
            if (!featureFlagsService.flags[guild.id]!['coletar_dados_de_membros_mensalmente']) continue;
            payload.push({guildName: guild.name, data: await RolesService.getMembersByRole(guild)})
        }
    }
}