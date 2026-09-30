import env from '../config/env.ts';
import type ILoggerService from '../types/services/loggerService.interface.ts';
import type IFeatureFlagsRepository from '../types/repositories/featureFlagsRepository.interface.ts';
import type IGuildsRepository from '../types/repositories/guildsRepository.interface.ts';
import type ICommandHashRepository from '../types/repositories/commandHashRepository.interface.ts';
import type IWarningRepository from '../types/repositories/warningRepository.interface.ts';
import type IMessageRepository from '../types/repositories/messageRepository.interface.ts';
import type IMembersRepository from '../types/repositories/members.repository.ts';
import type IN8NMessageProvider from '../types/providers/n8n/messageProvider.interface.ts';
import DatabaseConnection from './database/drizzle.client.ts';
import SqliteConnection from './database/sqlite.client.ts';
import FeatureFlagsRepository from './database/repositories/featureFlags.repository.ts';
import GuildsRepository from './database/repositories/guilds.repository.ts';
import CommandHashRepository from './database/repositories/commandHash.repository.ts';
import WarningRepository from './database/repositories/warning.repository.ts';
import MessageRepository from './database/repositories/message.repository.ts';
import MembersRepository from './database/repositories/onlineMembers.repository.ts';
import SqliteFeatureFlagsRepository from './database/repositories/sqlite/featureFlags.repository.ts';
import SqliteGuildsRepository from './database/repositories/sqlite/guilds.repository.ts';
import SqliteCommandHashRepository from './database/repositories/sqlite/commandHash.repository.ts';
import SqliteWarningRepository from './database/repositories/sqlite/warning.repository.ts';
import NoopMessageRepository from './database/repositories/noop/message.repository.ts';
import NoopMembersRepository from './database/repositories/noop/members.repository.ts';
import N8nAdapter from './adapters/n8n.adapter.ts';
import NoopN8nAdapter from './adapters/noopN8n.adapter.ts';

export type Persistence = {
    featureFlagsRepository: IFeatureFlagsRepository;
    guildsRepository: IGuildsRepository;
    commandHashRepository: ICommandHashRepository;
    warningRepository: IWarningRepository;
    messageRepository: IMessageRepository;
    memberRepository: IMembersRepository;
    n8nAdapter: IN8NMessageProvider;
    disconnect: () => Promise<void>;
};

/**
 * Monta tudo o que depende de serviços externos (banco de dados e n8n).
 *
 * - Normal: PostgreSQL + n8n.
 * - SLIM: SQLite local só para as tabelas operacionais (servidores, feature flags, hashes dos comandos e avisos de
 *   eventos). Mensagens, enquetes e contagens de membros não são salvas e nada é enviado ao n8n.
 */
export default async function createPersistence(logger: ILoggerService): Promise<Persistence> {
    if (env.SLIM) {
        logger.info('SLIM mode enabled: SQLite only, message/poll/member data is not saved and n8n is disabled');

        const connection = new SqliteConnection(logger, env.SQLITE_PATH);
        const database = await connection.connect();

        return {
            featureFlagsRepository: new SqliteFeatureFlagsRepository(database),
            guildsRepository: new SqliteGuildsRepository(database),
            commandHashRepository: new SqliteCommandHashRepository(database),
            warningRepository: new SqliteWarningRepository(database),
            messageRepository: new NoopMessageRepository(),
            memberRepository: new NoopMembersRepository(),
            n8nAdapter: new NoopN8nAdapter(),
            disconnect: () => connection.disconnect(),
        };
    }

    const connection = new DatabaseConnection(logger, env.DATABASE_URL);
    const database = await connection.connect();

    return {
        featureFlagsRepository: new FeatureFlagsRepository(database),
        guildsRepository: new GuildsRepository(database),
        commandHashRepository: new CommandHashRepository(database),
        warningRepository: new WarningRepository(database),
        messageRepository: new MessageRepository(database),
        memberRepository: new MembersRepository(database),
        n8nAdapter: new N8nAdapter(logger, { endpoint: env.N8N_ENDPOINT, token: env.N8N_WEBHOOKS_TOKEN }),
        disconnect: () => connection.disconnect(),
    };
}
