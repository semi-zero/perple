import { sql } from 'drizzle-orm';
import { text, integer, pgTable, jsonb, uuid, serial } from 'drizzle-orm/pg-core';

// 사용자 테이블
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  department: text('department').notNull(),
  email: text('email').unique().notNull()
});

// 공간(스페이스) 테이블
export const spaces = pgTable('spaces', {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceName: text('spaceName').notNull()
  });
  

// 채팅 테이블
export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('createdAt').notNull(),
  focusMode: text('focusMode').notNull(),
  files: jsonb('files').$type<File[]>(), // 변경된 부분: chats 테이블에 spaceId 추가 및 spaces 테이블 참조
  spaceId: uuid('spaceId').references(() => spaces.id, { onDelete: 'set null' }),
  userId: uuid('userId').notNull().references(() => users.id)
});

// 메시지 테이블
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  messageId: text('messageId').notNull(),
  role: text('role', { enum: ['assistant', 'user'] }).notNull(),
  metadata: jsonb('metadata').default({}).$type<Record<string, any> | null>(),
  chatId: text('chatId').notNull().references(() => chats.id)
});

// 공간 - 사용자 (M:N 관계) (기존과 동일)
export const spaceUsers = pgTable('space_users', {
  spaceId: uuid('spaceId').notNull().references(() => spaces.id),
  userId: uuid('userId').notNull().references(() => users.id),
}, (t) => ({
  pk: [t.spaceId, t.userId]
}));

// 공간 - 채팅 (M:N 관계) 테이블 삭제 (더 이상 필요 없음)
// export const spaceChats = pgTable('space_chats', {
//   spaceId: uuid('space_id').notNull().references(() => spaces.id),
//   chatId: text('chat_id').notNull().references(() => chats.id),
// }, (t) => ({
//   pk: [t.spaceId, t.chatId]
// }));