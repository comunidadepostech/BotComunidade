import type {Poll} from "../dtos/n8n.dtos.ts";
import type {InteractionPayload} from "../dtos/n8n.dtos.ts";
import type StudyGroupAnalysisPayload from "../dtos/studyGroupAnalysis.dto.ts";
import type {SaveMembersDto} from "../dtos/saveMembers.dto.ts";

export default interface IN8nService {
    savePoll(poll: Poll): Promise<void>;
    saveInteraction(interaction: InteractionPayload): Promise<void>;
    saveStudyGroupAnalysis(payload: StudyGroupAnalysisPayload): Promise<void>
    saveRolesMembersCount(payload: SaveMembersDto): Promise<void>
    saveOnlineMembers(payload: number): Promise<void>
}