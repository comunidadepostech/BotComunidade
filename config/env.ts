function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`A variavel de ambiente ${key} está faltando.`);
    return value;
}

export const env = {
    DISCORD_BOT_TOKEN: requireEnv('DISCORD_BOT_TOKEN'),
    MYSQL_DATABASE_URL: requireEnv('MYSQL_DATABASE_URL'),
    WEBHOOK_TOKEN: requireEnv('WEBHOOK_TOKEN'),
    N8N_ENDPOINT: requireEnv('N8N_ENDPOINT'),
    N8N_WEBHOOKS_TOKEN: requireEnv('N8N_WEBHOOKS_TOKEN'),
    PRIMARY_WEBHOOK_PORT: requireEnv('PRIMARY_WEBHOOK_PORT'),
    DISCORD_EVENTS_CHECK_TIME_IN_MINUTES: Number(requireEnv('DISCORD_EVENTS_CHECK_TIME_IN_MINUTES')),
    DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT: requireEnv('DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT'),
    REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES: Number(requireEnv('REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES')),
    LINKEDIN_SHARE_ROUTE: requireEnv('LINKEDIN_SHARE_ROUTE'),
    SAVE_LOGS_LOCALLY: process.env["SAVE_LOGS_LOCALLY"] === 'true',
    EVENTS_CACHE_CLEAR_TIME_IN_MINUTES: Number(requireEnv("EVENTS_CACHE_CLEAR_TIME_IN_MINUTES")),
    HOUR_OF_THE_DAY_TO_CLEAR_WARNING_MESSAGES: Number(requireEnv("HOUR_OF_THE_DAY_TO_CLEAR_WARNING_MESSAGES")),
    ONLINE_MEMBERS_COUNT_DELAY_IN_MINUTES: Number(requireEnv("ONLINE_MEMBERS_COUNT_DELAY_IN_MINUTES")),
    DEBUG: process.env["DEBUG"] === 'true',
    MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS: Number(requireEnv("MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS")),
} as const;