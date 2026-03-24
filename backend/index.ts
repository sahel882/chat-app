import app from "./src/app";
import { connectDB } from "./src/db";
import { createServer } from "http";
import { initializeSocket } from "./src/utils/socket";

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

initializeSocket(httpServer);

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log("Server is running on PORT: ", PORT)
    })
}).catch((error) => {
    console.log("Failed to start server:", error);
    process.exit(1);
})