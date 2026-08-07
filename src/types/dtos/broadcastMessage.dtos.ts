
import type { Attachment } from "../attachment.type";
import type { Channel } from "../channel.types";

export default interface BroadcastMessageDTO {
    targetChannel: Channel;
    content: string;
    files: Attachment[]
    onlyTargetChannel: boolean;
    targetClusters?: string[];
}
