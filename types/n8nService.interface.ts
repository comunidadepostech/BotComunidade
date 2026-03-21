import type {Poll} from "../dtos/n8n.dtos.ts";
import type {InteractionPayload} from "../dtos/n8n.dtos.ts";
import type StudyGroupAnalysisPayload from "../dtos/studyGroupAnalysis.dto.ts";
import type {SaveMembersDto} from "../dtos/saveMembersDto.ts";

export default interface IN8nService {
    savePoll(poll: Poll): Promise<void>;
    saveInteraction(interaction: InteractionPayload): Promise<void>;
    saveStudyGroupAnalysis(payload: StudyGroupAnalysisPayload): Promise<void>
    saveMembersData(payload: SaveMembersDto): Promise<void>
}