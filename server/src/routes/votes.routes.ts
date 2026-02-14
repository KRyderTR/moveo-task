import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { Vote } from "../models/Vote";

const router = Router();

type Section = "news" | "prices" | "ai" | "meme";

function dateKey(d = new Date()) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// POST /votes
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
    const { section, vote, context } = req.body as {
        section?: Section;
        vote?: number;
        context?: unknown;
    };

    if (!section || !["news", "prices", "ai", "meme"].includes(section)) {
        return res.status(400).json({ message: "INVALID_SECTION" });
    }

    if (vote !== 1 && vote !== -1) {
        return res.status(400).json({ message: "INVALID_VOTE" });
    }

    const today = dateKey();

    await Vote.findOneAndUpdate(
        { userId: req.userId, dateKey: today, section },
        { vote, context },
        { upsert: true, new: true }
    );

    res.json({ ok: true });
});

// GET /votes/daily
router.get("/daily", requireAuth, async (req: AuthedRequest, res) => {
    const today = dateKey();

    const votes = await Vote.find({
        userId: req.userId,
        dateKey: today,
    }).lean();

    const result: Record<string, number> = {};

    for (const v of votes) {
        result[v.section] = v.vote;
    }

    res.json({ dateKey: today, votes: result });
});

export default router;
