import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getChatById, getMessagesByChatId } from "../db/queries";

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId!;
        const chatId = req.params.chatId as string;

        const chat = await getChatById(chatId);
        if (!chat) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }

        const isParticipant = chat.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
            res.status(403).json({ message: "You are not a participant of this chat" });
            return;
        }

        const messages = await getMessagesByChatId(chatId);
        res.json(messages);
    } catch (error) {
        res.status(500);
        next(error);
    }
}