import logger from "../../utils/logger.js";

export default function handleSendLivePoll(turma?: string): void {
    if (!turma) throw new Error("O valor da turma não foi passado como parâmetro");
    logger.debug("Live recebida")
}
