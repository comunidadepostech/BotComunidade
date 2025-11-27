var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CountMembersByRole_instances, _CountMembersByRole_getMembersByRole;
import logger from "../../utils/logger.js";
import getTimeUntilNextMonth from "../../utils/getTimeUntilNextMonth.js";
class CountMembersByRole {
    constructor(bot) {
        _CountMembersByRole_instances.add(this);
        this.bot = bot;
        this.name = import.meta.url.split('/').pop().replace('.js', '');
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            let payload = {};
            for (const guild of this.bot.client.guilds.cache.values()) {
                if (this.bot.flags[guild.id]['saveMembers'] === false)
                    continue;
                payload[guild.name] = yield __classPrivateFieldGet(this, _CountMembersByRole_instances, "m", _CountMembersByRole_getMembersByRole).call(this, guild);
            }
            const res = yield fetch(`${process.env.N8N_ENDPOINT}/salvarMembros`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': process.env.N8N_TOKEN
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                logger.error(`Erro ao enviar dados para o n8n: ${res.status} - ${res.statusText} - ${res.url}`);
            }
            setTimeout(() => this.execute().catch((error) => logger.error(`Erro ao executar ${this.name}: ${error}`)), getTimeUntilNextMonth(this.name));
        });
    }
}
_CountMembersByRole_instances = new WeakSet(), _CountMembersByRole_getMembersByRole = function _CountMembersByRole_getMembersByRole(guild) {
    return __awaiter(this, void 0, void 0, function* () {
        const roles = yield guild.roles.fetch();
        const members = yield guild.members.fetch();
        const roleCounts = [];
        roles.forEach(role => {
            if (role.name)
                roleCounts.push({ roleName: role.name, count: members.filter(member => member.roles.cache.has(role.id)).size });
        });
        return roleCounts;
    });
};
export default CountMembersByRole;
