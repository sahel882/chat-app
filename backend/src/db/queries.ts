import { db } from "./index";
import { eq, and, ne } from "drizzle-orm";
import {
    users,
    chats,
    chatParticipants,
    messages,
    type NewUser,
    type NewChat,
    type NewMessage,
} from "./schema";

export const createUser = async (data: NewUser) => {
    const [user] = await db.insert(users).values(data).returning();
    return user;
};

export const getUserById = async (id: string) => {
    return db.query.users.findFirst({
        where: eq(users.id, id),
    });
};

export const upsertUser = async (data: NewUser) => {
    const [user] = await db
        .insert(users)
        .values(data)
        .onConflictDoUpdate({
            target: users.id,
            set: data,
        })
        .returning();
    return user;
};

export const getAllUsersExcept = async (userId: string) => {
    return db.query.users.findMany({
        where: ne(users.id, userId),
        columns: {
            id: true,
            name: true,
            email: true,
            avatar: true,
        },
        limit: 50,
    });
};

export const updateUser = async (id: string, data: Partial<NewUser>) => {
    const existingUser = await getUserById(id);
    if (!existingUser) throw new Error(`User with id ${id} not found`);

    const [user] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
    return user;
};

export const deleteUser = async (id: string) => {
    const existingUser = await getUserById(id);
    if (!existingUser) throw new Error(`User with id ${id} not found`);

    const [user] = await db.delete(users).where(eq(users.id, id)).returning();
    return user;
};

export const createChat = async (participantIds: string[]) => {
    const [chat] = await db.insert(chats).values({}).returning();
    if (!chat) throw new Error("Failed to create chat");

    await db.insert(chatParticipants).values(
        participantIds.map((userId) => ({
            chatId: chat.id,
            userId,
        }))
    );

    return chat;
};

export const getChatById = async (id: string) => {
    return db.query.chats.findFirst({
        where: eq(chats.id, id),
        with: {
            participants: {
                with: { user: true },
            },
            lastMessage: true,
        },
    });
};

export const getChatsByUserId = async (userId: string) => {
    const userChats = await db.query.chatParticipants.findMany({
        where: eq(chatParticipants.userId, userId),
        with: {
            chat: {
                with: {
                    participants: {
                        with: { user: true },
                    },
                    lastMessage: true,
                },
            },
        },
    });

    return userChats.map((uc) => uc.chat);
};

export const findChatBetweenUsers = async (userAId: string, userBId: string) => {
    const userAChats = await db.query.chatParticipants.findMany({
        where: eq(chatParticipants.userId, userAId),
    });

    const userAChatIds = userAChats.map((c) => c.chatId);

    for (const chatId of userAChatIds) {
        const shared = await db.query.chatParticipants.findFirst({
            where: and(
                eq(chatParticipants.chatId, chatId),
                eq(chatParticipants.userId, userBId)
            ),
        });
        if (shared) return getChatById(chatId);
    }

    return null;
};

export const updateChatLastMessage = async (chatId: string, messageId: string) => {
    const [chat] = await db
        .update(chats)
        .set({ lastMessageId: messageId, lastMessageAt: new Date() })
        .where(eq(chats.id, chatId))
        .returning();
    return chat;
};

export const deleteChat = async (id: string) => {
    const existingChat = await getChatById(id);
    if (!existingChat) throw new Error(`Chat with id ${id} not found`);

    const [chat] = await db.delete(chats).where(eq(chats.id, id)).returning();
    return chat;
};

export const createMessage = async (data: NewMessage) => {
    const [message] = await db.insert(messages).values(data).returning();
    if (!message) throw new Error("Failed to create message");

    await updateChatLastMessage(data.chatId, message.id);

    return message;
};

export const getMessageById = async (id: string) => {
    return db.query.messages.findFirst({
        where: eq(messages.id, id),
        with: { sender: true },
    });
};

export const getMessagesByChatId = async (chatId: string) => {
    return db.query.messages.findMany({
        where: eq(messages.chatId, chatId),
        with: { sender: true },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
};

export const deleteMessage = async (id: string) => {
    const existingMessage = await getMessageById(id);
    if (!existingMessage) throw new Error(`Message with id ${id} not found`);

    const [message] = await db.delete(messages).where(eq(messages.id, id)).returning();
    return message;
};