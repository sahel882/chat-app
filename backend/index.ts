import app from "./src/app";
import { connectDB } from "./src/db";

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running on PORT: ", PORT)
    })
})