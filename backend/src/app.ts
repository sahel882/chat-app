import express from "express";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/UserRoutes";

const app = express();

app.use(express.json())

app.get("/test", (req, res) => {
    res.json({ message: "Server is online" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/auth/users", userRoutes);

export default app;