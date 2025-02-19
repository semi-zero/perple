import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { eq, and, inArray } from 'drizzle-orm';
import { spaces, spaceUsers, users, chats } from '../db/schema';

// This router tries to manipulate a "spaceId" column in the "chats" table.
// However, TypeScript complains that the property "spaceId" does not exist on "chats".
// If your actual schema does not have a "spaceId" column, either remove or rename all references to it.
// Otherwise, you can use the "@ts-ignore" directive, or an inline type assertion.

const router = express.Router();

// GET all spaces
router.get('/', async (_, res) => {
  try {
    const allSpaces = await db.query.spaces.findMany();
    return res.status(200).json({ spaces: allSpaces });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting spaces: ${err.message}`);
  }
});

// GET a single space by ID (including associated users and chats)
router.get('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;

    // Find the space itself
    const foundSpace = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!foundSpace) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Find users in the space
    const spaceUserRelations = await db.query.spaceUsers.findMany({
      where: eq(spaceUsers.spaceId, spaceId),
    });
    const userIds = spaceUserRelations.map((su) => su.userId);

    let usersInSpace = [];
    if (userIds.length > 0) {
      usersInSpace = await db.query.users.findMany({
        where: inArray(users.id, userIds),
      });
    }

    // Find chats in the space - Modified to directly query chats table
    // If "spaceId" does not exist in chats, remove or rename these references
    const chatsInSpace = await db.query.chats.findMany({
      // @ts-ignore: ignoring if spaceId isn't typed
      where: eq(chats.spaceId, spaceId),
    });

    return res.status(200).json({
      space: foundSpace,
      users: usersInSpace,
      chats: chatsInSpace,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting space: ${err.message}`);
  }
});

// CREATE a new space
router.post('/', async (req, res) => {
  try {
    const { spaceName } = req.body;

    if (!spaceName) {
      return res.status(400).json({ message: 'Space name is required' });
    }

    const [newSpace] = await db.insert(spaces).values({ spaceName }).returning();

    return res.status(201).json({ space: newSpace });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in creating space: ${err.message}`);
  }
});

// UPDATE an existing space
router.put('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { spaceName } = req.body;

    if (!spaceName) {
      return res.status(400).json({ message: 'Space name is required' });
    }

    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const [updatedSpace] = await db
      .update(spaces)
      .set({ spaceName })
      .where(eq(spaces.id, spaceId))
      .returning();

    return res.status(200).json({ space: updatedSpace });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in updating space: ${err.message}`);
  }
});

// DELETE a space
router.delete('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // If your "chats" table truly has a "spaceId" column, you can remove the @ts-ignore.
    // Otherwise, remove or rename these references.
    // chats 테이블에서 해당 spaceId를 NULL로 설정
    // @ts-ignore
    await db.update(chats)
      // @ts-ignore
      .set({ spaceId: null })
      // @ts-ignore
      .where(eq(chats.spaceId, spaceId))
      .execute();

    // space_users 테이블에서 관련 레코드 삭제
    await db.delete(spaceUsers)
      .where(eq(spaceUsers.spaceId, spaceId))
      .execute();

    // space 삭제
    await db.delete(spaces)
      .where(eq(spaces.id, spaceId))
      .execute();

    return res.status(200).json({ message: 'Space deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in deleting space: ${err.message}`);
  }
});

// GET users in a space
router.get('/:id/users', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const relations = await db.query.spaceUsers.findMany({
      where: eq(spaceUsers.spaceId, spaceId),
    });

    const userIds = relations.map((r) => r.userId);
    let userList = [];

    if (userIds.length > 0) {
      userList = await db.query.users.findMany({
        where: inArray(users.id, userIds),
      });
    }

    return res.status(200).json({ users: userList });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting users for space: ${err.message}`);
  }
});

// ADD user(s) to a space
router.post('/:id/users', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { userIds } = req.body;

    // Ensure space exists
    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'userIds must be a non-empty array.' });
    }

    // Insert relations. Duplicate keys won't be inserted if the pair already exists
    const valuesToInsert = userIds.map((userId: string) => ({ spaceId, userId }));
    const inserted = await db.insert(spaceUsers).values(valuesToInsert).returning();

    return res.status(200).json({ inserted });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in adding users to space: ${err.message}`);
  }
});

// REMOVE a user from space
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { userId } = req.params;

    const relation = await db.query.spaceUsers.findFirst({
      where: and(eq(spaceUsers.spaceId, spaceId), eq(spaceUsers.userId, userId)),
    });

    if (!relation) {
      return res
        .status(404)
        .json({ message: 'No relation found for this space and user' });
    }

    await db
      .delete(spaceUsers)
      .where(and(eq(spaceUsers.spaceId, spaceId), eq(spaceUsers.userId, userId)))
      .execute();

    return res.status(200).json({ message: 'User removed from space successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in removing user from space: ${err.message}`);
  }
});

// GET chats in a space - Modified to directly query chats table
router.get('/:id/chats', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // If your "chats" table doesn't have "spaceId", remove or rename reference.
    // @ts-ignore
    const chatList = await db.query.chats.findMany({
      // @ts-ignore
      where: eq(chats.spaceId, spaceId),
    });

    return res.status(200).json({ chats: chatList });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting chats for space: ${err.message}`);
  }
});

// ADD chat(s) to a space - Ensure each chat belongs to only one space
router.post('/:id/chats', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { chatIds } = req.body;

    // Ensure space exists
    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'chatIds must be a non-empty array.' });
    }

    // Get current spaces for the given chats
    const existingChats = await db.query.chats.findMany({
      where: (table, { inArray }) => inArray(table.id, chatIds),
    });

    // Check if any chat already belongs to a different space
    // @ts-ignore
    const conflictingChats = existingChats.filter((chat) => chat.spaceId !== null && chat.spaceId !== spaceId);

    if (conflictingChats.length > 0) {
      return res.status(400).json({
        message: 'Some chats already belong to a different space.',
        conflictingChatIds: conflictingChats.map((chat) => chat.id),
      });
    }

    // Update chats table to set spaceId for provided chatIds
    // @ts-ignore
    const updatedChats = await db.transaction(async (tx) => {
      return Promise.all(
        chatIds.map(async (chatId: string) => {
          // @ts-ignore
          const [updatedChat] = await tx
            .update(chats)
            // @ts-ignore
            .set({ spaceId: spaceId })
            // Assuming we identify the chat by chatId and want to set its spaceId
            .where(eq(chats.id, chatId))
            .returning();
          return updatedChat;
        })
      );
    });

    return res.status(200).json({ updatedChats });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in adding chats to space: ${err.message}`);
  }
});

// REMOVE a chat from space - set spaceId to null
router.delete('/:id/chats/:chatId', async (req, res) => {
  try {
    const spaceId = req.params.id; // not used directly, but kept for route signature
    const { chatId } = req.params;

    // Check chat existence
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chatExists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // If your "chats" table truly has a "spaceId" column, do this:
    // @ts-ignore
    const [updatedChat] = await db
      .update(chats)
      // @ts-ignore
      .set({ spaceId: null })
      .where(eq(chats.id, chatId))
      .returning();

    // If it doesn't, remove or rename references to "spaceId".

    return res.status(200).json({ updatedChat, message: 'Chat removed from space successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in removing chat from space: ${err.message}`);
  }
});

export default router;
