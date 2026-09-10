import DatabaseConnection from '../src/infrastructure/database/drizzle.client.ts';
import CommandHashRepository from '../src/infrastructure/database/repositories/commandHash.repository.ts';
import FeatureFlagsRepository from '../src/infrastructure/database/repositories/featureFlags.repository.ts';
import GuildsRepository from '../src/infrastructure/database/repositories/guilds.repository.ts';
import MessageRepository from '../src/infrastructure/database/repositories/message.repository.ts';
import MembersRepository from '../src/infrastructure/database/repositories/onlineMembers.repository.ts';
import WarningRepository from '../src/infrastructure/database/repositories/warning.repository.ts';
import type ILoggerService from '../src/types/services/loggerService.interface.ts';

const silent = {
    info: () => {},
    error: console.error,
    warn: () => {},
    debug: () => {},
} as unknown as ILoggerService;

let failures = 0;

async function check(name: string, fn: () => Promise<unknown>, expected?: unknown): Promise<void> {
    try {
        const result = await fn();

        if (expected !== undefined && JSON.stringify(result) !== JSON.stringify(expected)) {
            failures++;
            console.log(`FALHA ${name}: esperado ${JSON.stringify(expected)}, veio ${JSON.stringify(result)}`);
            return;
        }

        console.log(`OK    ${name}`);
    } catch (error) {
        failures++;
        console.log(`FALHA ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

const connection = new DatabaseConnection(silent);
const db = await connection.connect();

const commandHashes = new CommandHashRepository(db);
const featureFlags = new FeatureFlagsRepository(db);
const guilds = new GuildsRepository(db);
const messages = new MessageRepository(db);
const members = new MembersRepository(db);
const warnings = new WarningRepository(db);

await check('commandHash.saveCommand (insert)', () => commandHashes.saveCommand('ping', 'hash-a'));
await check('commandHash.saveCommand (upsert)', () => commandHashes.saveCommand('ping', 'hash-b'));
await check('commandHash.updateCommand', () => commandHashes.updateCommand('ping', 'hash-c'));
await check('commandHash.getCommandByName', () => commandHashes.getCommandByName('ping'), {
    command_name: 'ping',
    file_hash: 'hash-c',
});
await check('commandHash.getCommandByName (ausente)', () => commandHashes.getCommandByName('nao-existe'), null);
await check('commandHash.getAllCommands', async () => (await commandHashes.getAllCommands()).length, 1);
await check('commandHash.deleteCommand (string)', () => commandHashes.deleteCommand('ping'));
await check('commandHash.deleteCommand (array)', () => commandHashes.deleteCommand(['a', 'b']));
await check('commandHash.clearAllCommands', () => commandHashes.clearAllCommands());

await check('guilds.addGuild', () => guilds.addGuild('123456789012345678', 'ADS', 'cluster-a, cluster-b'));
await check('guilds.getGuildIdByCourse', () => guilds.getGuildIdByCourse('ADS'), { guild_id: '123456789012345678' });
await check('guilds.getGuildCourseById', () => guilds.getGuildCourseById('123456789012345678'), {
    guild_name: 'ADS',
});
await check('guilds.getGuildIdsByCluster', () => guilds.getGuildIdsByCluster('cluster-b'), ['123456789012345678']);
await check('guilds.getGuildIdsByCluster (sem match)', () => guilds.getGuildIdsByCluster('cluster-z'), []);
await check('guilds.getAllGuilds', async () => (await guilds.getAllGuilds()).length, 1);

await check('featureFlags.saveDefaultFeatureFlags', () => featureFlags.saveDefaultFeatureFlags('987654321098765432'));
await check('featureFlags.getGuildFeatureFlags (ausente)', () => featureFlags.getGuildFeatureFlags('000'), {});
await check('featureFlags.updateFlagByGuildId', () =>
    featureFlags.updateFlagByGuildId('987654321098765432', 'echo', false),
);
await check(
    'featureFlags.updateFlagByGuildId gravou',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['echo'],
    false,
);
await check('featureFlags.updateFeatureFlag', () => featureFlags.updateFeatureFlag('987654321098765432', 'echo', true));
await check(
    'featureFlags.updateFeatureFlag gravou',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['echo'],
    true,
);
await check('featureFlags.createFeatureFlag', () => featureFlags.createFeatureFlag('flagNova', true));
await check(
    'featureFlags.createFeatureFlag gravou',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['flagNova'],
    true,
);
await check('featureFlags.updateManyFeatureFlags (tx)', () =>
    featureFlags.updateManyFeatureFlags([
        { guildId: '987654321098765432', flags: { echo: false } },
        { guildId: '111111111111111111', flags: { echo: true } },
    ]),
);
await check(
    'featureFlags.getAllFeatureFlags',
    async () => Object.keys(await featureFlags.getAllFeatureFlags()).length,
    2,
);
await check('featureFlags.getAllFeatureFlagsRaw', async () => (await featureFlags.getAllFeatureFlagsRaw()).length, 2);
await check('featureFlags.deleteFeatureFlag', () => featureFlags.deleteFeatureFlag('echo'));
await check(
    'featureFlags.deleteFeatureFlag removeu',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['echo'],
    undefined,
);

await check('message.saveMessage', () =>
    messages.saveMessage({
        message_id: '1234567890',
        guild_name: 'ADS',
        category: 'geral',
        role_name: 'Estudante',
        user_name: 'felipe',
        channel_name: 'avisos',
        message: 'ola mundo',
        thread_name: null,
    }),
);
await check('message.savePoll', () =>
    messages.savePoll({
        poll_hash: 'abc123',
        guild_name: 'ADS',
        category: 'geral',
        poll_question: 'Qual a melhor linguagem?',
        response1_text: 'TypeScript',
        response1_value: 10,
        response2_text: 'Rust',
        response2_value: 7,
    }),
);

await check('members.saveOnlineMembers', () => members.saveOnlineMembers(42));
await check('members.saveTotalMembers (insert)', () => members.saveTotalMembers('3ADS', 30, 'ADS'));
await check('members.saveTotalMembers (upsert)', () => members.saveTotalMembers('3ADS', 31, 'ADS'));

await check('warning.saveWarningMessage', () => warnings.saveWarningMessage('canal-1', 'A', 'evento-1'));
await check('warning.saveWarningMessage (2)', () => warnings.saveWarningMessage('canal-2', 'B', 'evento-2'));
await check('warning.syncWarningMessages', () => warnings.syncWarningMessages());
await check('warning.listWarningMessages', async () => warnings.listWarningMessages().length, 2);
await check('warning.deleteWarningMessage', () => warnings.deleteWarningMessage('B'));
await check(
    'warning.deleteWarningMessage mantem os outros',
    async () => warnings.listWarningMessages().map((message) => message.message_id),
    ['A'],
);

await connection.disconnect();

console.log(failures === 0 ? '\nTodos os passos passaram.' : `\n${failures} falha(s).`);
process.exit(failures === 0 ? 0 : 1);
