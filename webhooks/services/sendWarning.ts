import Bot from "../../bot.ts";
import {NOME_CANAL_DE_AVISO, SERVIDORES_DO_DISCORD} from "../../lib/constants.ts";

export default async function sendWarning(bot: Bot, req: any) {
    const mensagem: string | undefined = req.body?.mensagem;
    const turma: string | undefined = req.body?.turma;

    if (!mensagem || !turma) throw new Error("O aviso precisa de uma mensagem e turma para ser entregue!")

    const id_do_servidor: string | undefined = SERVIDORES_DO_DISCORD[turma.replaceAll(/\d+/g, '') as keyof typeof SERVIDORES_DO_DISCORD];
    if (!id_do_servidor) throw new Error(`O servidor da turma ${turma} não foi encontrado, o mesmo já foi adicionado as constantes?`)

    const servidor = bot.client.guilds.cache.get(id_do_servidor)
    if (!servidor) throw new Error(`O servidor da turma ${turma} não foi encontrado. O bot está nesse servidor?`)
    const canal = servidor.channels.cache.find(channel => channel.parent?.name === turma && channel.name === NOME_CANAL_DE_AVISO)
    if (!canal) throw new Error(`O canal de avisos da turma ${turma} não foi encontrado!`)

    const cargo = servidor.roles.cache.find(role => role.name === "Estudantes " + turma)
    if (!cargo) throw new Error(`Cargo da turma ${turma} não foi encontrado!`)

    if (!canal.isTextBased()) return // Verificação para o TS não reclamar
    await canal.send(mensagem.replaceAll("{cargo}", `${cargo}`))
}
