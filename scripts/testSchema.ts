const CONTAINER = 'postgres-test';
const PORT = 5434;
const DATABASE_URL = `postgresql://root:root@localhost:${PORT}/bot_test`;

async function run(cmd: string[], env?: Record<string, string>): Promise<number> {
    const proc = Bun.spawn(cmd, { stdout: 'inherit', stderr: 'inherit', env: { ...process.env, ...env } });

    return await proc.exited;
}

async function isReady(): Promise<boolean> {
    const proc = Bun.spawn(['docker', 'exec', CONTAINER, 'pg_isready', '-U', 'root', '-q'], {
        stdout: 'ignore',
        stderr: 'ignore',
    });

    return (await proc.exited) === 0;
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

    console.log('\n> Aplicando src/db/schema.ts no banco limpo (drizzle-kit push)\n');
    status = await run(['bunx', 'drizzle-kit', 'push', '--force'], { DATABASE_URL });

    if (status === 0) {
        console.log('\n> Round-trip de escrita/leitura em cada tabela\n');
        status = await run(['bun', 'run', 'scripts/smokeTest.ts'], { DATABASE_URL });
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
} finally {
    await run(['docker', 'stop', CONTAINER]);
    await run(['docker', 'rm', CONTAINER]);
}

process.exit(status);
