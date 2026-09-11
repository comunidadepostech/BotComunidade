import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const featureFlags = pgTable('featureFlags', {
    guild_id: text('guild_id').primaryKey().notNull(),
    flags: jsonb('flags').$type<Record<string, boolean>>(),
});

export const classes = pgTable(
    'classes',
    {
        class: text('class').notNull(),
        quantity: integer('quantity'),
        guild_name: text('guild_name').notNull(),
    },
    (table) => [unique('class').on(table.class)],
);

export const commandHashes = pgTable('command_hashes', {
    command_name: text('command_name').primaryKey().notNull(),
    file_hash: text('file_hash').notNull(),
});

export const discordEventWarnings = pgTable('discord_event_warnings', {
    message_id: text('message_id').primaryKey().notNull(),
    channel_id: text('channel_id').notNull(),
    event_id: text('event_id').notNull(),
});

export const guilds = pgTable('guilds', {
    guild_id: text('guild_id').notNull(),
    guild_name: text('guild_name').primaryKey().notNull(),
    clusters: text('clusters'),
});

export const interactions = pgTable(
    'interactions',
    {
        message_id: text('message_id').notNull(),
        guild_name: text('guild_name').notNull(),
        category: text('category'),
        role_name: text('role_name'),
        user_name: text('user_name').notNull(),
        channel_name: text('channel_name').notNull(),
        message: text('message').notNull(),
        thread_name: text('thread_name'),
        dt: timestamp('dt', { mode: 'string', precision: 0 }).default(sql`CURRENT_TIMESTAMP`),
        id: serial('id').primaryKey().notNull(),
    },
    (table) => [index('idx_message_id').using('btree', table.message_id.asc().nullsLast().op('text_ops'))],
);

export const onlineMembers = pgTable('online_members', {
    dt: timestamp('dt', { mode: 'string', precision: 0 }).primaryKey().notNull(),
    quantity: integer('quantity').notNull(),
});

export const polls = pgTable('polls', {
    poll_hash: text('poll_hash'),
    guild_name: text('guild_name').notNull(),
    category: text('category').notNull(),
    poll_question: text('poll_question').notNull(),
    response1_text: text('response1_text').notNull(),
    response1_value: integer('response1_value').notNull(),
    response2_text: text('response2_text').notNull(),
    response2_value: integer('response2_value').notNull(),
    response3_text: text('response3_text'),
    response3_value: integer('response3_value'),
    response4_text: text('response4_text'),
    response4_value: integer('response4_value'),
    response5_text: text('response5_text'),
    response5_value: integer('response5_value'),
    response6_text: text('response6_text'),
    response6_value: integer('response6_value'),
    response7_text: text('response7_text'),
    response7_value: integer('response7_value'),
    response8_text: text('response8_text'),
    response8_value: integer('response8_value'),
    response9_text: text('response9_text'),
    response9_value: integer('response9_value'),
    response10_text: text('response10_text'),
    response10_value: integer('response10_value'),
    dt: timestamp('dt', { mode: 'string', precision: 0 }).default(sql`CURRENT_TIMESTAMP`),
    id: serial('id').primaryKey().notNull(),
});

export const zoomMeetings = pgTable('zoom_meetings', {
    title: text('title').notNull(),
    department: text('department'),
    duration_in_minutes: integer('duration_in_minutes').notNull(),
    host_email: text('host_email').notNull(),
    metting_creation_source: text('metting_creation_source').notNull(),
    metting_group: text('metting_group'),
    created_at: timestamp('created_at', { mode: 'string', precision: 0 }).notNull(),
    started_at: timestamp('started_at', { mode: 'string', precision: 0 }).notNull(),
    ended_at: timestamp('ended_at', { mode: 'string', precision: 0 }).notNull(),
    meeting_id: text('meeting_id').notNull(),
    max_simultaneous_views: integer('max_simultaneous_views').default(0).notNull(),
    host_name: text('host_name'),
    max_entries: integer('max_entries').notNull(),
    meeting_type: text('meeting_type').notNull(),
    max_unique_views: integer('max_unique_views').notNull(),
    place: text('place'),
    total_participants_minutes: integer('total_participants_minutes').notNull(),
    id: serial('id').primaryKey().notNull(),
});
