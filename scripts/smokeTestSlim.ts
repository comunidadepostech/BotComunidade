/**
 * Smoke test do modo SLIM: não precisa de PostgreSQL, Docker, n8n nem Discord.
 * Uso: bun run test:slim
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SqliteConnection, { SQLITE_IN_MEMORY } from '../src/infrastructure/database/sqlite.client.ts';
import SqliteCommandHashRepository from '../src/infrastructure/database/repositories/sqlite/commandHash.repository.ts';
import SqliteFeatureFlagsRepository from '../src/infrastructure/database/repositories/sqlite/featureFlags.repository.ts';
import SqliteGuildsRepository from '../src/infrastructure/database/repositories/sqlite/guilds.repository.ts';
import SqliteWarningRepository from '../src/infrastructure/database/repositories/sqlite/warning.repository.ts';
import NoopMessageRepository from '../src/infrastructure/database/repositories/noop/message.repository.ts';
import NoopMembersRepository from '../src/infrastructure/database/repositories/noop/members.repository.ts';
import NoopN8nAdapter from '../src/infrastructure/adapters/noopN8n.adapter.ts';
import GuildService from '../src/services/guild.service.ts';
import FeatureFlagsService from '../src/services/featureFlags.service.ts';
import { DEFAULT_FEATURE_FLAGS } from '../src/utils/constants/flagsConstants.ts';
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

const connection = new SqliteConnection(silent, SQLITE_IN_MEMORY);
const db = await connection.connect();

const commandHashes = new SqliteCommandHashRepository(db);
const featureFlags = new SqliteFeatureFlagsRepository(db);
const guilds = new SqliteGuildsRepository(db);
const warnings = new SqliteWarningRepository(db);

console.log('\n> Repositórios SQLite');

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
await check('commandHash.getAllCommands (após delete)', async () => (await commandHashes.getAllCommands()).length, 0);
await check('commandHash.deleteCommand (array)', () => commandHashes.deleteCommand(['a', 'b']));
await check('commandHash.clearAllCommands', () => commandHashes.clearAllCommands());

await check('guilds.addGuild', () => guilds.addGuild('123456789012345678', 'ADS', 'cluster-a, cluster-b'));
await check('guilds.addGuild (repetido mantém a configuração)', () => guilds.addGuild('123456789012345678', '', ''));
await check('guilds.getGuildIdByCourse', () => guilds.getGuildIdByCourse('ADS'), { guild_id: '123456789012345678' });
await check('guilds.getGuildIdByCourse (ausente)', () => guilds.getGuildIdByCourse('XYZ'), null);
await check('guilds.getGuildCourseById', () => guilds.getGuildCourseById('123456789012345678'), { guild_name: 'ADS' });
await check('guilds.getGuildIdsByCluster', () => guilds.getGuildIdsByCluster('cluster-b'), ['123456789012345678']);
await check('guilds.getGuildIdsByCluster (sem match)', () => guilds.getGuildIdsByCluster('cluster-z'), []);
await check('guilds.getGuildIdsByCluster (case sensitive)', () => guilds.getGuildIdsByCluster('CLUSTER-A'), []);
await check('guilds.addGuild (dois servidores sem sigla)', async () => {
    await guilds.addGuild('111111111111111111', '', '');
    await guilds.addGuild('222222222222222222', '', '');
});
await check('guilds.getAllGuilds', async () => (await guilds.getAllGuilds()).length, 3);

await check('featureFlags.saveDefaultFeatureFlags', () => featureFlags.saveDefaultFeatureFlags('987654321098765432'));
await check('featureFlags.getGuildFeatureFlags (ausente)', () => featureFlags.getGuildFeatureFlags('000'), {});
await check('featureFlags.updateFlagByGuildId', () =>
    featureFlags.updateFlagByGuildId('987654321098765432', 'comando_exec', true),
);
await check(
    'featureFlags.updateFlagByGuildId gravou',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['comando_exec'],
    true,
);
await check(
    'featureFlags.saveDefaultFeatureFlags (repetido não sobrescreve)',
    async () => {
        await featureFlags.saveDefaultFeatureFlags('987654321098765432');
        return (await featureFlags.getGuildFeatureFlags('987654321098765432'))['comando_exec'];
    },
    true,
);
await check('featureFlags.updateFeatureFlag', () =>
    featureFlags.updateFeatureFlag('987654321098765432', 'comando_exec', false),
);
await check(
    'featureFlags.updateFeatureFlag gravou',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['comando_exec'],
    false,
);
await check('featureFlags.createFeatureFlag', () => featureFlags.createFeatureFlag('flagNova', true));
await check(
    'featureFlags.createFeatureFlag gravou',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['flagNova'],
    true,
);
await check('featureFlags.updateManyFeatureFlags (tx)', () =>
    featureFlags.updateManyFeatureFlags([
        { guildId: '987654321098765432', flags: { comando_exec: false, flagNova: true } },
        { guildId: '111111111111111111', flags: { comando_exec: true } },
    ]),
);
await check(
    'featureFlags.getAllFeatureFlags',
    async () => Object.keys(await featureFlags.getAllFeatureFlags()).length,
    2,
);
await check('featureFlags.getAllFeatureFlagsRaw', async () => (await featureFlags.getAllFeatureFlagsRaw()).length, 2);
await check('featureFlags.deleteFeatureFlag', () => featureFlags.deleteFeatureFlag('flagNova'));
await check(
    'featureFlags.deleteFeatureFlag removeu',
    async () => 'flagNova' in (await featureFlags.getGuildFeatureFlags('987654321098765432')),
    false,
);
await check(
    'featureFlags.deleteFeatureFlag mantém as outras flags',
    async () => (await featureFlags.getGuildFeatureFlags('987654321098765432'))['comando_exec'],
    false,
);

await check('warning.saveWarningMessage', () => warnings.saveWarningMessage('canal-1', 'A', 'evento-1'));
await check('warning.saveWarningMessage (2)', () => warnings.saveWarningMessage('canal-2', 'B', 'evento-2'));
await check('warning.syncWarningMessages', () => warnings.syncWarningMessages());
await check('warning.listWarningMessages', async () => warnings.listWarningMessages().length, 2);
await check('warning.deleteWarningMessage', () => warnings.deleteWarningMessage('B'));
await check(
    'warning.deleteWarningMessage mantém os outros',
    async () => warnings.listWarningMessages().map((message) => message.message_id),
    ['A'],
);

await connection.disconnect();

console.log('\n> Bootstrap de servidores (primeira execução, SQLite vazio)');

{
    const freshConnection = new SqliteConnection(silent, SQLITE_IN_MEMORY);
    const freshDb = await freshConnection.connect();
    const freshGuilds = new SqliteGuildsRepository(freshDb);
    const freshFlags = new SqliteFeatureFlagsRepository(freshDb);
    const guildService = new GuildService(freshGuilds, freshFlags);
    const flagsService = new FeatureFlagsService(freshFlags, freshGuilds);

    await check('guildService.registerMissingGuilds (novos)', () => guildService.registerMissingGuilds(['g1', 'g2']), [
        'g1',
        'g2',
    ]);
    await check(
        'guildService.registerMissingGuilds (repetido)',
        () => guildService.registerMissingGuilds(['g1', 'g2']),
        [],
    );
    await check(
        'guildService.registerMissingGuilds (só o que falta)',
        () => guildService.registerMissingGuilds(['g2', 'g3']),
        ['g3'],
    );

    await flagsService.fillFlags();
    await flagsService.checkFlags();
    await flagsService.syncFlags();

    await check('featureFlagsService.getFlagsByGuildId (padrão)', () => flagsService.getFlagsByGuildId('g1'), {
        ...DEFAULT_FEATURE_FLAGS,
    });
    await check(
        'featureFlagsService.isEnabled (g3)',
        async () => flagsService.isEnabled('g3', 'salvar_interacoes'),
        false,
    );
    await check(
        'featureFlagsService.setFlag persiste',
        async () => {
            await flagsService.setFlag('g1', 'comando_exec', true);
            return (await freshFlags.getGuildFeatureFlags('g1'))['comando_exec'];
        },
        true,
    );

    await freshConnection.disconnect();
}

console.log('\n> Null objects (nada é salvo nem enviado)');

await check('message.saveMessage', () => new NoopMessageRepository().saveMessage());
await check('message.savePoll', () => new NoopMessageRepository().savePoll());
await check('members.saveOnlineMembers', () => new NoopMembersRepository().saveOnlineMembers());
await check('members.saveTotalMembers', () => new NoopMembersRepository().saveTotalMembers());
await check('n8n.saveMessage', () => new NoopN8nAdapter().saveMessage());
await check('n8n.savePoll', () => new NoopN8nAdapter().savePoll());

console.log('\n> Persistência em arquivo');

{
    const directory = mkdtempSync(join(tmpdir(), 'slim-'));
    const path = join(directory, 'nested', 'dir', 'slim.sqlite');

    try {
        const first = new SqliteConnection(silent, path);
        await new SqliteCommandHashRepository(await first.connect()).saveCommand('ping', 'hash-a');
        await first.disconnect();

        const second = new SqliteConnection(silent, path);
        const reopened = new SqliteCommandHashRepository(await second.connect());
        await check('arquivo (cria pastas e persiste entre execuções)', () => reopened.getCommandByName('ping'), {
            command_name: 'ping',
            file_hash: 'hash-a',
        });
        await second.disconnect();
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

console.log(failures === 0 ? '\nTodos os passos passaram.' : `\n${failures} falha(s).`);
process.exit(failures === 0 ? 0 : 1);
