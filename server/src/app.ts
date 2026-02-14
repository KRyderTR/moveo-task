import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import preferencesRoutes from "./routes/preferences.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import votesRoutes from "./routes/votes.routes";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/preferences", preferencesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/votes", votesRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
