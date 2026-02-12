import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { Preferences } from "../models/Preferences";

const router = Router();

// get my preferences (null if not onboarded yet)
router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const prefs = await Preferences.findOne({ userId: req.userId });
  res.json({ preferences: prefs || null });
});

// save/update my preferences (onboarding submit)
router.post("/me", requireAuth, async (req: AuthedRequest, res) => {
  const { assets, investorType, contentTypes } = req.body;

  if (!investorType) return res.status(400).json({ message: "investorType is required" });

  const prefs = await Preferences.findOneAndUpdate(
    { userId: req.userId },
    { userId: req.userId, assets: assets || [], investorType, contentTypes: contentTypes || [] },
    { upsert: true, new: true }
  );

  res.json({ preferences: prefs });
});

export default router;
