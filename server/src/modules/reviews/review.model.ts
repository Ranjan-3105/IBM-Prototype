import { Schema, model, Types } from "mongoose";

const reviewSchema = new Schema(
  {
    application: { type: Types.ObjectId, ref: "Application", required: true, unique: true },
    reviewer: { type: Types.ObjectId, ref: "User", required: true }, // organisation
    reviewee: { type: Types.ObjectId, ref: "User", required: true, index: true }, // seeker
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    verifiedSkills: [{ type: String }], // slugs — upgraded to source ENDORSED on the seeker
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const Review = model("Review", reviewSchema);
