import {PollMessageDTO} from "../../entities/dto/pollMessageDTO.ts";
import {PollLayoutType} from "discord.js"

export default async function poll(dto: PollMessageDTO) {
    await dto.channel.send({
        poll: {
            question: dto.question,
            answers: dto.options,
            allowMultiselect: dto.allowMultiSelect,
            duration: dto.duration,
            layoutType: PollLayoutType.Default
        }
    });
}