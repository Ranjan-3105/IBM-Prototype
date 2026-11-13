import { Schema, model, Types } from "mongoose";
import { EVIDENCE_KINDS } from "../common/constants";

const evidenceSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    kind: { type: String, enum: EVIDENCE_KINDS, required: true },
    url: String,
    description: String,
    skills: [{ type: String }], // catalogue slugs
    endorsedBy: { type: Types.ObjectId, ref: "User" }, // organisation
    endorsedAt: Date,
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const SkillEvidence = model("SkillEvidence", evidenceSchema);
