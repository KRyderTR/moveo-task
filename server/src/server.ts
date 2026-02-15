import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Check server/.env");
  }

  await connectDB(process.env.MONGO_URI);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
