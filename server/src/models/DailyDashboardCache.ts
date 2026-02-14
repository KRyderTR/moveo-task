import mongoose from "mongoose";

const DailyDashboardCacheSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        dateKey: { type: String, required: true }, // YYYY-MM-DD

        // cached sections (stable for the day)
        news: { type: mongoose.Schema.Types.Mixed, required: true },
        prices: { type: mongoose.Schema.Types.Mixed, required: true },
        aiInsight: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

DailyDashboardCacheSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const DailyDashboardCache = mongoose.model(
    "DailyDashboardCache",
    DailyDashboardCacheSchema
);
