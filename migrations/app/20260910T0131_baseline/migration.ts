#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/02551700a1195b8afbd028fb059b8717fe35ce1124fec269ebdc5988a140f1ac/contract';
import endContract from '../../snapshots/02551700a1195b8afbd028fb059b8717fe35ce1124fec269ebdc5988a140f1ac/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'classes',
        columns: [
          col('class', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('guild_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'command_hashes',
        columns: [
          col('command_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('file_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['command_name'], { name: 'command_hashes_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'discord_event_warnings',
        columns: [
          col('channel_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('event_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('message_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['message_id'], { name: 'discord_event_warnings_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'featureFlags',
        columns: [
          col('flags', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('guild_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['guild_id'], { name: 'featureFlags_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'guilds',
        columns: [
          col('clusters', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('guild_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('guild_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['guild_name'], { name: 'guilds_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'interactions',
        columns: [
          col('category', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('channel_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('dt', 'timestamp(0)', {
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 0 } },
          }),
          col('guild_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('message_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role_name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('thread_name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'interactions_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'online_members',
        columns: [
          col('dt', 'timestamp(0)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 0 } },
          }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['dt'], { name: 'online_members_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'polls',
        columns: [
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('dt', 'timestamp(0)', {
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 0 } },
          }),
          col('guild_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('poll_hash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('poll_question', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('response10_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response10_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response1_text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('response1_value', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('response2_text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('response2_value', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('response3_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response3_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response4_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response4_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response5_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response5_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response6_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response6_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response7_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response7_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response8_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response8_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('response9_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('response9_value', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'polls_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'zoom_meetings',
        columns: [
          col('created_at', 'timestamp(0)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 0 } },
          }),
          col('department', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('duration_in_minutes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('ended_at', 'timestamp(0)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 0 } },
          }),
          col('host_email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('host_name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('max_entries', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('max_simultaneous_views', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('max_unique_views', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('meeting_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('meeting_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('metting_creation_source', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('metting_group', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('place', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('started_at', 'timestamp(0)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 0 } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('total_participants_minutes', 'int4', {
            notNull: true,
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'zoom_meetings_pkey' })],
      }),
      this.addUnique({
        schema: 'public',
        table: 'classes',
        constraint: 'class',
        columns: ['class'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'interactions',
        index: 'idx_message_id',
        columns: ['message_id'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
