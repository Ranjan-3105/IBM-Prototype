import { Schema, model } from "mongoose";
import { SKILL_CATEGORIES } from "../common/constants";

const skillSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    category: { type: String, enum: SKILL_CATEGORIES, default: "OTHER" },
    aliases: [{ type: String }],
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const Skill = model("Skill", skillSchema);
