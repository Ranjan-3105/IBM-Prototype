import { Schema, model, Types } from "mongoose";

/** Cache of computed matches + AI explanations. The score always comes from engine.ts. */
const matchSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    opportunity: { type: Types.ObjectId, ref: "Opportunity", required: true },
    score: { type: Number, required: true },
    breakdown: { S: Number, A: Number, L: Number, E: Number, P: Number },
    matchedSkills: [String],
    missingSkills: [{ _id: false, skill: String, needed: Number, have: Number, mandatory: Boolean }],
    explanation: String,
    explanationSource: { type: String, enum: ["AI", "TEMPLATE"], default: "TEMPLATE" },
    /** Hash of the inputs; when it changes the explanation is regenerated. */
    fingerprint: String,
    computedAt: { type: Date, default: Date.now },
  },
  { toJSON: { versionKey: false } }
);

matchSchema.index({ user: 1, opportunity: 1 }, { unique: true });

export const Match = model("Match", matchSchema);
