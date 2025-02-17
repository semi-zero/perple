import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { eq, and, inArray } from 'drizzle-orm';
import { spaces, spaceUsers, spaceChats, users, chats } from '../db/schema';

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

    // Find chats in the space
    const spaceChatRelations = await db.query.spaceChats.findMany({
      where: eq(spaceChats.spaceId, spaceId),
    });
    const chatIds = spaceChatRelations.map((sc) => sc.chatId);

    let chatsInSpace = [];
    if (chatIds.length > 0) {
      chatsInSpace = await db.query.chats.findMany({
        where: inArray(chats.id, chatIds),
      });
    }

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

    // Remove references from space_users
    await db.delete(spaceUsers).where(eq(spaceUsers.spaceId, spaceId)).execute();
    // Remove references from space_chats
    await db.delete(spaceChats).where(eq(spaceChats.spaceId, spaceId)).execute();

    // Finally, remove the space
    await db.delete(spaces).where(eq(spaces.id, spaceId)).execute();

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

// GET chats in a space
router.get('/:id/chats', async (req, res) => {
  try {
    const spaceId = req.params.id;

    const spaceExists = await db.query.spaces.findFirst({
      where: eq(spaces.id, spaceId),
    });

    if (!spaceExists) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const relations = await db.query.spaceChats.findMany({
      where: eq(spaceChats.spaceId, spaceId),
    });

    const chatIds = relations.map((r) => r.chatId);
    let chatList = [];

    if (chatIds.length > 0) {
      chatList = await db.query.chats.findMany({
        where: inArray(chats.id, chatIds),
      });
    }

    return res.status(200).json({ chats: chatList });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting chats for space: ${err.message}`);
  }
});

// ADD chat(s) to a space
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

    const valuesToInsert = chatIds.map((chatId: string) => ({ spaceId, chatId }));
    const inserted = await db.insert(spaceChats).values(valuesToInsert).returning();

    return res.status(200).json({ inserted });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in adding chats to space: ${err.message}`);
  }
});

// REMOVE a chat from space
router.delete('/:id/chats/:chatId', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const { chatId } = req.params;

    const relation = await db.query.spaceChats.findFirst({
      where: and(eq(spaceChats.spaceId, spaceId), eq(spaceChats.chatId, chatId)),
    });

    if (!relation) {
      return res
        .status(404)
        .json({ message: 'No relation found for this space and chat' });
    }

    await db
      .delete(spaceChats)
      .where(and(eq(spaceChats.spaceId, spaceId), eq(spaceChats.chatId, chatId)))
      .execute();

    return res.status(200).json({ message: 'Chat removed from space successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in removing chat from space: ${err.message}`);
  }
});

export default router;
