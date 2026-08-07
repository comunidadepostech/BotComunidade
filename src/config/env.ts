type EnvTypeMap = {
    string: string;
    number: number;
    boolean: boolean;
};

function parseEnv<T extends 'string' | 'number' | 'boolean' = 'string'>(key: string, expectedType?: T): EnvTypeMap[T] {
    const type = expectedType ?? ('string' as T);
    const value = process.env[key];

    if (!value) throw new Error(`A variavel de ambiente ${key} está faltando.`);

    switch (type) {
        case 'number': {
            const num = parseInt(value, 10);
            if (isNaN(num)) throw new Error(`A variavel de ambiente ${key} não é um número válido.`);
            return num as EnvTypeMap[T];
        }
        case 'boolean':
            if (value !== 'true' && value !== 'false')
                throw new Error(`A variavel de ambiente ${key} não é um booleano válido.`);
            return (value === 'true') as EnvTypeMap[T];
        default:
            return value as EnvTypeMap[T];
    }
}

const env = {
    DISCORD_BOT_TOKEN: parseEnv('DISCORD_BOT_TOKEN', 'string'),
    DATABASE_URL: parseEnv('DATABASE_URL', 'string'),
    WEBHOOK_TOKEN: parseEnv('WEBHOOK_TOKEN', 'string'),
    N8N_ENDPOINT: parseEnv('N8N_ENDPOINT', 'string'),
    N8N_WEBHOOKS_TOKEN: parseEnv('N8N_WEBHOOKS_TOKEN', 'string'),
    PRIMARY_WEBHOOK_PORT: parseEnv('PRIMARY_WEBHOOK_PORT', 'number'),
    DISCORD_EVENTS_CHECK_TIME_IN_MINUTES: parseEnv('DISCORD_EVENTS_CHECK_TIME_IN_MINUTES', 'number'),
    DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT: parseEnv('DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT', 'number'),
    REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES: parseEnv('REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES', 'number'),
    SAVE_LOGS_LOCALLY: parseEnv('SAVE_LOGS_LOCALLY', 'boolean'),
    CLEAR_WARNING_MESSAGES_AFTER_X_HOURS: parseEnv('CLEAR_WARNING_MESSAGES_AFTER_X_HOURS', 'number'),
    ONLINE_MEMBERS_COUNT_DELAY_IN_MINUTES: parseEnv('ONLINE_MEMBERS_COUNT_DELAY_IN_MINUTES', 'number'),
    DEBUG: parseEnv('DEBUG', 'boolean'),
    MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS: parseEnv(
        'MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS',
        'number',
    ),
    CLEAR_WARNING_MESSAGES_EVENT_DELAY_IN_HOURS: parseEnv('CLEAR_WARNING_MESSAGES_EVENT_DELAY_IN_HOURS', 'number'),
    LIVE_FORMS_DURATION_IN_MINUTES: parseEnv('LIVE_FORMS_DURATION_IN_MINUTES', 'number'),
};

export default Object.freeze(env);
