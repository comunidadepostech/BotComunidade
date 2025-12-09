import logger from "../../utils/logger.js";
import Bot from "../../bot.js";
import {serverNames} from "../../utils/servers.js";

export default async function removeEvent(bot: Bot, req: any): Promise<void> {
    if (!req.body.evento) throw new Error("Para envir a mensagem é necessário especificar o 'evento' com a turma e título do evento separados por ' - '");

    // Formata o nome da turma com o número da frente
    const classNameWithNumber: string = req.body.evento.split(" - ")[0]

    // Formata o nome da turma sem o número (para identificar o servidor)
    const classNameWithoutNumber: string = classNameWithNumber.replaceAll(/\d+/g, '')

    // Obtem o servidor a partir do nome da turma
    const guild = bot.client.guilds.cache.get(serverNames[classNameWithoutNumber])

    if (!guild) throw new Error(`Servidor ${classNameWithoutNumber} não encontrado`)

    // Deleta o evento com o ID especificado
    await guild.scheduledEvents.delete(req.body.eventID)

    logger.log(`Evento ${req.body.eventID} removido com sucesso`)
}
