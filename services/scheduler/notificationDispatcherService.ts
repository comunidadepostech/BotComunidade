import { Role, TextChannel } from 'discord.js';
import type { INotificationDispatcher } from '../../types/modularScheduler.interfaces.ts';
import type { IWarningRepository } from '../../types/repository.interfaces.ts';

/**
 * NotificationDispatcherService - Lida com o envio de notificações relacionadas a eventos
 * Implementa INotificationDispatcher
 *
 * Responsabilidades:
 * - Formatar e enviar mensagens de aviso para canais do Discord
 * - Registrar mensagens enviadas no repositório de avisos para limpeza posterior
 *
 * SOLID: Responsabilidade Única (Single Responsibility) - Apenas gerencia o despacho de notificações
 */
export default class NotificationDispatcherService implements INotificationDispatcher {
    constructor(private readonly databaseWarningRepository: IWarningRepository) {}

    /**
     * Envia uma mensagem de aviso para um canal específico e a registra no banco de dados
     *
     * @param classRole - O cargo (role) do Discord para mencionar
     * @param eventUrl - A URL do evento agendado
     * @param scheduledStartTimestamp - Quando o evento deve começar
     * @param channel - O canal de texto onde a mensagem será enviada
     */
    async dispatchWarning(
        classRole: Role | undefined,
        eventUrl: string,
        scheduledStartTimestamp: number,
        channel: TextChannel,
    ): Promise<void> {
        const date = new Date(scheduledStartTimestamp);
        const hours = date.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
        });

        const messageContent =
            `Boa noite, turma!! ${classRole ? classRole.toString() : ''}\n\n` +
            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
            `acesse o card do evento [aqui](${eventUrl})`;

        const message = await channel.send(messageContent);

        // Registrar a mensagem no repositório para que possa ser limpa mais tarde
        await this.databaseWarningRepository.save(message.id, message.channelId);
    }
}
