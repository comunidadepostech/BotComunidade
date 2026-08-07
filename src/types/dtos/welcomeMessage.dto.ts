import type { Channel } from "../channel.types";

export default interface WelcomeMessageDTO {
    channel: Channel;
    memberName: string;
    memberId: string;
    memberAvatarURL: string;
}