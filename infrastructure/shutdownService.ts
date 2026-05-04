import type { IDatabaseConnection } from '../types/repository.interfaces.ts';
import { Client } from 'discord.js';
import type { IDiscordCommandsService } from '../types/discord.interfaces.ts';

/**
 * ShutdownService - Gerencia o encerramento gracioso da aplicação
 *
 * Responsabilidades:
 * - Limpar comandos do Discord
 * - Fechar conexões com o banco de dados
 * - Limpar recursos do cliente do Discord
 * - Encerrar o processo
 *
 * SOLID:
 * - Responsabilidade Única: Apenas lida com operações de encerramento
 * - Inversão de Dependência: Usa interfaces para dependências
 */
export default class ShutdownService {
    /**
     * Encerra a aplicação de forma graciosa
     * Garante que todos os recursos sejam devidamente limpos antes da saída
     *
     * Passos:
     * 1. Remover todos os ouvintes de eventos
     * 2. Limpar comandos de todos os servidores (guilds)
     * 3. Fechar conexões com o banco de dados
     * 4. Destruir o cliente do Discord
     * 5. Encerrar o processo
     */
    public static async shutdown(
        client: Client,
        commandService: IDiscordCommandsService,
        databaseConnection: IDatabaseConnection,
    ): Promise<void> {
        try {
            console.log('Starting graceful shutdown...');

            // Remover todos os ouvintes para evitar novos eventos
            client.removeAllListeners();
            console.log('Removed event listeners');

            // Limpar comandos de todos os servidores
            await commandService.clearCommands(Array.from(client.guilds.cache.values()));
            console.log('Commands cleared from guilds');

            // Fechar conexão com o banco de dados
            await databaseConnection.endConnection();
            console.log('Database connection closed');

            // Destruir o cliente do Discord
            await client.destroy();
            console.log('Discord client destroyed');

            process.exit(0);
        } catch (error) {
            console.error(
                `Error during shutdown: ${error instanceof Error ? error.message : String(error)}`,
            );
            process.exit(1);
        }
    }
}
