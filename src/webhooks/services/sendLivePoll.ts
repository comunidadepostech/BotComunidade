import logger from "../../utils/logger.js";
import Bot from "../../bot.js";
import {serverNames} from "../../utils/servers.js";
import safeSetTimeout from "../../utils/safeTimeout.js";
import {Role} from "discord.js"

export default async function handleSendLivePoll(bot: Bot, req: any): Promise<void> {
    if (!req.body.evento) throw new Error("Para envir a mensagem é necessário especificar o 'evento' com a turma e título do evento separados por ' - '");

    // Formata o nome da turma com o número da frente
    const classNameWithNumber: string = req.body.evento.split(" - ")[0]

    // Formata o nome da turma sem o número (para identificar o servidor)
    const classNameWithoutNumber: string = classNameWithNumber.replaceAll(/\d+/g, '')

    // Se o servidor não for encontrado ignora o evento e registra um warn
    if (!serverNames[classNameWithoutNumber]) {
        logger.warn(`Envio de link de feedback suprimido pois o evento não é válido: ${req.body.evento}`)
        return
    }

    // Tenta dar fetch na guild usando a nomenclatura da turma
    const guild = await bot.client.guilds.fetch(serverNames[classNameWithoutNumber]);

    // Verifica se o servidor tem a feature habilitada
    if (!bot.flags[guild.id]["sendLiveForms"]) {
        logger.warn(`Envio de link de feedback das lives desabilitado no servidor ${guild.name} - Envio cancelado`)
        return
    }

    // Busca o cargo da turma
    const role: Role | undefined = guild.roles.cache.find((role: Role) => role.name === `Estudantes ${classNameWithNumber}`)

    const channels = guild.channels.cache.filter(channel => channel.name === "💬│bate-papo").values()

    for (const channel of channels) {
        const parentName: string = guild.channels.cache.get(channel.parentId!)!.name // Busca o nome da turma nas categorias

        if (!channel.isTextBased()) continue

        // Verifica se o nome da categoria corresponde ao nome da turma e envia a mensagem
        if (parentName === classNameWithNumber) {
            await channel.send("Fala, turma! E aí, o que acharam da live?\n" +
                "\n" +
                "Enquanto o conteúdo ainda está fresco na memória, queremos muito saber a sua opinião!\n" +
                "Preencha o formulário abaixo e nos ajude a criar encontros cada vez mais incríveis. Contamos com você!\n" +
                "\n" +
                "Link do formulário: https://forms.gle/dFJAUdijQ6jUeZbr6\n" +
                `${role}`
            ).then(message => safeSetTimeout(async () => message.delete(), 10 * 60 * 1000))

            return
        }
    }

    // Se não encontrar nada, devolve um erro
    throw new Error(`Nenhuma categoria com o nome da turma ${classNameWithNumber} foi encontrado`)
}
