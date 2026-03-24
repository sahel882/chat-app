import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getChatsByUserId, findChatBetweenUsers, createChat, getChatById } from "../db/queries";

export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId!;

        const chats = await getChatsByUserId(userId);

        const formattedChats = chats.map((chat) => {
            const otherParticipant = chat.participants.find((p) => p.userId !== userId);
            return {
                id: chat.id,
                participant: otherParticipant?.user ?? null,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
                createdAt: chat.createdAt,
            };
        });

        res.json(formattedChats);
    } catch (error) {
        res.status(500);
        next(error);
    }
}

export async function getOrCreateChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId!;
        const participantId = req.params.participantId as string;

        if (!participantId) {
            res.status(400).json({ message: "Participant ID is required" });
            return;
        }

        if (userId === participantId) {
            res.status(400).json({ message: "Cannot create chat with yourself" });
            return;
        }

        let chat = await findChatBetweenUsers(userId, participantId);

        if (!chat) {
            await createChat([userId, participantId]);
            chat = await findChatBetweenUsers(userId, participantId);
        }

        if (!chat) {
            res.status(500).json({ message: "Failed to create chat" });
            return;
        }

        const otherParticipant = chat.participants.find((p) => p.userId !== userId);

        res.json({
            id: chat.id,
            participant: otherParticipant?.user ?? null,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            createdAt: chat.createdAt,
        });
    } catch (error) {
        res.status(500);
        next(error);
    }
}