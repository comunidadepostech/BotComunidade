import { readdir } from 'node:fs/promises';

const CONTAINER = 'postgres-test';
const PORT = 5434;
const DATABASE_URL = `postgresql://root:root@localhost:${PORT}/bot_test`;

async function run(cmd: string[]): Promise<number> {
    const proc = Bun.spawn(cmd, { stdout: 'inherit', stderr: 'inherit' });

    return await proc.exited;
}

async function isReady(): Promise<boolean> {
    const proc = Bun.spawn(['docker', 'exec', CONTAINER, 'pg_isready', '-U', 'root', '-q'], {
        stdout: 'ignore',
        stderr: 'ignore',
    });

    return (await proc.exited) === 0;
}

async function hasOnDiskMigrations(): Promise<boolean> {
    try {
        const entries = await readdir('migrations/app', { withFileTypes: true });

        return entries.some((entry) => entry.isDirectory() && entry.name !== 'refs');
    } catch {
        return false;
    }
}

await run(['docker', 'rm', '-f', CONTAINER]);

const started = await run([
    'docker',
    'run',
    '--name',
    CONTAINER,
    '-e',
    'POSTGRES_USER=root',
    '-e',
    'POSTGRES_PASSWORD=root',
    '-e',
    'POSTGRES_DB=bot_test',
    '-p',
    `${PORT}:5432`,
    '-d',
    'postgres:17-alpine',
]);

if (started !== 0) {
    console.error('Não foi possível subir o container do Postgres.');
    process.exit(started);
}

let status = 1;

try {
    const deadline = Date.now() + 60_000;

    while (!(await isReady())) {
        if (Date.now() > deadline) throw new Error('Postgres não ficou pronto em 60s.');
        await Bun.sleep(1000);
    }

    const replayMigrations = await hasOnDiskMigrations();

    console.log(
        replayMigrations
            ? '\n> Reproduzindo as migrações on-disk em ordem (db migrate)\n'
            : '\n> Sem migrações on-disk; construindo o schema a partir do contrato (db init)\n',
    );

    const build = replayMigrations
        ? ['bunx', 'prisma', 'db', 'migrate', '--yes', '--db', DATABASE_URL]
        : ['bunx', 'prisma', 'db', 'init', '--yes', '--db', DATABASE_URL];

    status = await run(build);

    if (status === 0) {
        console.log('\n> Conferindo o schema construído contra o contrato (db verify)\n');
        status = await run(['bunx', 'prisma', 'db', 'verify', '--db', DATABASE_URL]);
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
} finally {
    await run(['docker', 'stop', CONTAINER]);
    await run(['docker', 'rm', CONTAINER]);
}

process.exit(status);
