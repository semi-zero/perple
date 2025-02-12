import { sql } from 'drizzle-orm';
import { text, integer, pgTable, jsonb, uuid, serial } from 'drizzle-orm/pg-core';

// 사용자 테이블
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  department: text('department').notNull(),
  email: text('email').unique().notNull()
});

// 채팅 테이블
export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull(),
  focusMode: text('focus_mode').notNull(),
  files: jsonb('files').$type<File[]>(),
  userId: uuid('user_id').notNull().references(() => users.id)
});

// 메시지 테이블
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  messageId: text('message_id').notNull(),
  role: text('role', { enum: ['assistant', 'user'] }).notNull(),
  metadata: jsonb('metadata').default({}).$type<Record<string, any> | null>(),
  chatId: text('chat_id').notNull().references(() => chats.id)
});

// 공간(스페이스) 테이블
export const spaces = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceName: text('space_name').notNull()
});

// 공간 - 사용자 (M:N 관계)
export const spaceUsers = pgTable('space_users', {
  spaceId: uuid('space_id').notNull().references(() => spaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
}, (t) => ({
  pk: [t.spaceId, t.userId]
}));

// 공간 - 채팅 (M:N 관계)
export const spaceChats = pgTable('space_chats', {
  spaceId: uuid('space_id').notNull().references(() => spaces.id),
  chatId: text('chat_id').notNull().references(() => chats.id),
}, (t) => ({
  pk: [t.spaceId, t.chatId]
}));
