import type IMembersRepository from "../types/repositories/members.repository";
import type IMemberService from "../types/services/memberService.interface";

export default class MemberService implements IMemberService {
    constructor(private memberRepository: IMembersRepository) {}
    
    async saveOnlineMembers(total: number): Promise<void> {
        await this.memberRepository.saveOnlineMembers(total)
    }

    async saveTotalMembers(className: string, guildName: string, total: number): Promise<void> {
        await this.memberRepository.saveTotalMembers(className, total, guildName)
    } 
}