import mongoose from "mongoose";

const PreferencesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },

    assets: { type: [String], default: [] }, // e.g. ["bitcoin","ethereum"]
    investorType: {
      type: String,
      enum: ["HODLer", "Day Trader", "NFT Collector"],
      required: true,
    },
    contentTypes: { type: [String], default: [] }, // e.g. ["news","prices","ai","memes"]
  },
  { timestamps: true }
);

export const Preferences = mongoose.model("Preferences", PreferencesSchema);
