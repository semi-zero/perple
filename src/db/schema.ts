import { sql } from 'drizzle-orm';
import { text, integer, pgTable, jsonb, uuid, serial } from 'drizzle-orm/pg-core';

interface File {
  name: string;
  fileId: string;
}

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  chatId: text('chatid').notNull(),
  messageId: text('messageid').notNull(),
  role: text('role', { enum: ['assistant', 'user'] }).notNull(),
  metadata: jsonb('metadata').default({}).$type<Record<string, any> | null>(),
});

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('createdat').notNull(),
  focusMode: text('focusmode').notNull(),
  files: jsonb('files').$type<File[]>(),
});
