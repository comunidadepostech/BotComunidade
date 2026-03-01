import {BroadcastMessageDTO} from "../../entities/dto/broadcastMessageDTO.ts";

export default async function echo(dto: BroadcastMessageDTO) {
    const payload = {
        content: dto.content.replaceAll(String.raw`\n`, '\n'),
        files: dto.files,
    };

    if (dto.onlyTargetChannel) {
        await dto.targetChannel.send(payload)
        return;
    }

    // envia para todos os canais com mesmo nome em todos os servidores
    await Promise.all(
        [...dto.client.guilds.cache.values()].flatMap((guild) =>
            [...guild.channels.cache.filter((channel) => channel.name === dto.targetChannel.name).values()]
                .filter((channel) => channel.isTextBased())
                .map((channel) => channel.send(payload))
        )
    );
}