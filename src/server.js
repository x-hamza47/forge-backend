import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Forge API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
