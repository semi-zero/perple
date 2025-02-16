import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { eq, and, inArray } from 'drizzle-orm';
import { spaces, spaceUsers, spaceChats, users, chats } from '../db/schema';

const router = express.Router();

// ✅ GET all spaces (전체 스페이스 조회)
router.get('/', async (_, res) => {
  try {
    const allSpaces = await db.query.spaces.findMany();
    return res.status(200).json({ spaces: allSpaces });
  } catch (err: any) {
    logger.error(`Error fetching spaces: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ GET a single space by ID (Users & Chats 포함)
router.get('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const spaceWithRelations = await db
      .select({
        space: spaces,
        user: users,
        chat: chats,
      })
      .from(spaces)
      .leftJoin(spaceUsers, eq(spaces.id, spaceUsers.spaceId))
      .leftJoin(users, eq(spaceUsers.userId, users.id))
      .leftJoin(spaceChats, eq(spaces.id, spaceChats.spaceId))
      .leftJoin(chats, eq(spaceChats.chatId, chats.id))
      .where(eq(spaces.id, spaceId));

    if (spaceWithRelations.length === 0) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const space = spaceWithRelations[0].space;
    const usersInSpace = Array.from(new Set(spaceWithRelations.map((row) => row.user?.id && row.user))).filter(Boolean);
    const chatsInSpace = Array.from(new Set(spaceWithRelations.map((row) => row.chat?.id && row.chat))).filter(Boolean);

    return res.status(200).json({ space, users: usersInSpace, chats: chatsInSpace });
  } catch (err: any) {
    logger.error(`Error fetching space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ CREATE a new space
router.post('/', async (req, res) => {
  try {
    const { spaceName } = req.body;
    if (!spaceName) return res.status(400).json({ message: 'Space name is required' });

    const [newSpace] = await db.insert(spaces).values({ spaceName }).returning();
    return res.status(201).json({ space: newSpace });
  } catch (err: any) {
    logger.error(`Error creating space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE an existing space
router.put('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { spaceName } = req.body;

    if (!spaceName) return res.status(400).json({ message: 'Space name is required' });

    const [updatedSpace] = await db.update(spaces).set({ spaceName }).where(eq(spaces.id, spaceId)).returning();
    if (!updatedSpace) return res.status(404).json({ message: 'Space not found' });

    return res.status(200).json({ space: updatedSpace });
  } catch (err: any) {
    logger.error(`Error updating space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE a space (트랜잭션 적용)
router.delete('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;

    await db.transaction(async (tx) => {
      await tx.delete(spaceUsers).where(eq(spaceUsers.spaceId, spaceId));
      await tx.delete(spaceChats).where(eq(spaceChats.spaceId, spaceId));
      const deleted = await tx.delete(spaces).where(eq(spaces.id, spaceId)).returning();
      if (!deleted.length) throw new Error('Space not found');
    });

    return res.status(200).json({ message: 'Space deleted successfully' });
  } catch (err: any) {
    logger.error(`Error deleting space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ GET users in a space
router.get('/:id/users', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const usersInSpace = await db
      .select({ user: users })
      .from(spaceUsers)
      .innerJoin(users, eq(spaceUsers.userId, users.id))
      .where(eq(spaceUsers.spaceId, spaceId));

    return res.status(200).json({ users: usersInSpace });
  } catch (err: any) {
    logger.error(`Error fetching users for space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ ADD users to a space
router.post('/:id/users', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    const inserted = await db.insert(spaceUsers).values(userIds.map((userId) => ({ spaceId, userId }))).returning();
    return res.status(200).json({ inserted });
  } catch (err: any) {
    logger.error(`Error adding users to space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ REMOVE a user from space
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const { id: spaceId, userId } = req.params;

    const deleted = await db.delete(spaceUsers).where(and(eq(spaceUsers.spaceId, spaceId), eq(spaceUsers.userId, userId))).returning();
    if (!deleted.length) return res.status(404).json({ message: 'User not found in space' });

    return res.status(200).json({ message: 'User removed from space' });
  } catch (err: any) {
    logger.error(`Error removing user from space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

// ✅ GET chats in a space
router.get('/:id/chats', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const chatList = await db
      .select({ chat: chats })
      .from(spaceChats)
      .innerJoin(chats, eq(spaceChats.chatId, chats.id))
      .where(eq(spaceChats.spaceId, spaceId));

    return res.status(200).json({ chats: chatList });
  } catch (err: any) {
    logger.error(`Error fetching chats for space: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
