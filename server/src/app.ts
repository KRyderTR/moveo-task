import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import preferencesRoutes from "./routes/preferences.routes";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/preferences", preferencesRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
