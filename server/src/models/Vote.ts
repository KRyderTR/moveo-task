import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dateKey: { type: String, required: true },
    section: {
      type: String,
      enum: ["news", "prices", "ai", "meme"],
      required: true,
    },
    vote: {
      type: Number,
      enum: [1, -1],
      required: true,
    },
    context: {
      type: mongoose.Schema.Types.Mixed, // optional snapshot
    },
  },
  { timestamps: true }
);

// unique vote per user per section per day
VoteSchema.index({ userId: 1, dateKey: 1, section: 1 }, { unique: true });

export const Vote = mongoose.model("Vote", VoteSchema);
