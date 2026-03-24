import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { getChatById, createMessage, getMessageById, getUserById } from "../db/queries";

export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
    const allowedOrigins = [
        "http://localhost:8081",
        "http://localhost:5173",
        process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        try {
            const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
            const clerkId = session.sub;

            const user = await getUserById(clerkId);
            if (!user) return next(new Error("User not found"));

            socket.data.userId = user.id;
            next();
        } catch (error: any) {
            next(new Error(error));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

        onlineUsers.set(userId, socket.id);

        socket.broadcast.emit("user-online", { userId });

        socket.join(`user:${userId}`);

        socket.on("join-chat", (chatId: string) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on("leave-chat", (chatId: string) => {
            socket.leave(`chat:${chatId}`);
        });

        socket.on("send-message", async (data: { chatId: string; text: string }) => {
            try {
                const { chatId, text } = data;

                const chat = await getChatById(chatId);
                if (!chat) {
                    socket.emit("socket-error", { message: "Chat not found" });
                    return;
                }

                const isParticipant = chat.participants.some((p) => p.userId === userId);
                if (!isParticipant) {
                    socket.emit("socket-error", { message: "You are not a participant of this chat" });
                    return;
                }

                const message = await createMessage({ chatId, senderId: userId, text });
                const messageWithSender = await getMessageById(message.id);

                io.to(`chat:${chatId}`).emit("new-message", messageWithSender);

                for (const participant of chat.participants) {
                    io.to(`user:${participant.userId}`).emit("new-message", messageWithSender);
                }
            } catch (error) {
                socket.emit("socket-error", { message: "Failed to send message" });
            }
        });

        socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
            const typingPayload = {
                userId,
                chatId: data.chatId,
                isTyping: data.isTyping,
            };

            socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

            try {
                const chat = await getChatById(data.chatId);
                if (chat) {
                    const otherParticipant = chat.participants.find((p) => p.userId !== userId);
                    if (otherParticipant) {
                        socket.to(`user:${otherParticipant.userId}`).emit("typing", typingPayload);
                    }
                }
            } catch (error) {

            }
        });

        socket.on("disconnect", () => {
            onlineUsers.delete(userId);
            socket.broadcast.emit("user-offline", { userId });
        });
    });

    return io;
};