import { Schema, model, Types } from "mongoose";
import { APP_STATUS } from "../common/constants";

const applicationSchema = new Schema(
  {
    opportunity: { type: Types.ObjectId, ref: "Opportunity", required: true, index: true },
    applicant: { type: Types.ObjectId, ref: "User", required: true, index: true },
    matchScore: { type: Number, default: 0 }, // snapshot at apply time
    breakdown: { S: Number, A: Number, L: Number, E: Number, P: Number },
    message: { type: String, default: "" },
    status: { type: String, enum: APP_STATUS, default: "APPLIED" },
    history: [{ _id: false, status: { type: String, enum: APP_STATUS }, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

applicationSchema.index({ opportunity: 1, applicant: 1 }, { unique: true });

export const Application = model("Application", applicationSchema);
