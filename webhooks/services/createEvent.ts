import {serverNames} from "../../utils/servers.js";
import logger from "../../utils/logger.js";
import Bot from "../../bot.js";
import {ChannelType, GuildScheduledEvent} from "discord.js";

export default async function handleCreateEvent(bot: Bot, req): Promise<GuildScheduledEvent> {
    logger.debug(`Dados recebidos para criar evento: ${JSON.stringify(req.body)}`)

    const { turma, nomeEvento, tipo, data_hora, link, fim } = req.body;

    // Discord não permite cadastrar eventos com o nome maior que 100 caracteres
    if (nomeEvento.length > 90) {
        throw new Error("O nome da aula ultrapassa 100 caracteres, busque reduzir a quantidade de caracteres.");
    }

    // Tenta dar fetch na guild do evento usando a nomenclatura da turma
    const guild = await bot.client.guilds.fetch(serverNames[turma.replaceAll(/\d+/g, '').replaceAll(" ", "")] as string)
        .catch(() => {
            throw new Error(`Servidor de ${turma.replaceAll(/\d+/g, '')} não encontrado`)
        });

    // Busca os canais da guild da turma
    const channels = await guild.channels.fetch();

    // Filtra os canais buscando pelo canal de avisos e pelo parente que deve ser a turma
    const voiceChannel = channels.find(channel => channel!.name === `📒│Sala de estudo ${turma}` && channel!.type === ChannelType.GuildVoice);

    // Se o canal de voz não for encontrado retorna um erro
    if (!voiceChannel) {
        throw new Error(`Canal de voz para a turma ${turma} não encontrado.`);
    }

    const defaultEventDescription: Record<string, string | ((link: string) => string)> = {
        "Grupo de estudos": "Olá, turma!\n" +
            " \n" +
            "Temos um encontro marcado, onde você terá a oportunidade de compartilhar seus conhecimentos, discutir suas dificuldades e contribuir para um ambiente positivo de estudos. \n" +
            "\n" +
            "Não perca o bate papo do Grupo de Estudos!\n" +
            " \n" +
            "Obs: Este momento não será gravado\n",
        "Live": (link: string) => `Lembre-se que a live será no Zoom através do link: ${link}\n` +
            "\n" +
            "Obs.: Todas as lives serão gravadas e disponibilizadas no dia seguinte para a turma no canal #gravações",
        "Mentoria": (link: string) => "Olá, turma!\n" +
            " \n" +
            "Temos um encontro marcado, onde você terá a oportunidade de compartilhar seus conhecimentos, discutir suas dificuldades e contribuir para um ambiente positivo de estudos. \n" +
            "\n" +
            "Segue o link para a mentoria: " + link + "\n" +
            "\n" +
            "Não perca o bate papo da Mentoria!\n" +
            " \n" +
            "Obs: Este momento não será gravado"
    }

    // Define qual a descrição do evento baseado no tipo de evento
    let description: string = typeof defaultEventDescription[tipo] === "function"
        ? defaultEventDescription[tipo](link)!
        : defaultEventDescription[tipo]!;

    // Retorna o evento criado
    return guild.scheduledEvents.create({
        name: `${turma} - ${nomeEvento}`,
        scheduledStartTime: new Date(data_hora),
        scheduledEndTime: new Date(fim),
        privacyLevel: 2,
        entityType: 2,
        channel: voiceChannel.id,
        description: description,
        image: './src/assets/postech.png'
    });
}