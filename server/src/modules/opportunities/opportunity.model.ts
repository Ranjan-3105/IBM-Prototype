import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { OPP_TYPES, COMP_KINDS, ACCESS_TAGS, BBSR } from "../common/constants";

const opportunitySchema = new Schema(
  {
    organisation: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: OPP_TYPES, required: true },
    requiredSkills: [
      {
        _id: false,
        skill: { type: String, required: true }, // catalogue slug
        minLevel: { type: Number, min: 1, max: 5, default: 2 },
        mandatory: { type: Boolean, default: false },
      },
    ],
    isRemote: { type: Boolean, default: false },
    area: String, // e.g. "Saheed Nagar"
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: BBSR },
    },
    hoursPerWeek: { type: Number, required: true, min: 1 },
    compensation: {
      kind: { type: String, enum: COMP_KINDS, default: "UNPAID" },
      amount: Number, // INR per month (optional)
    },
    accessibilityProvided: [{ type: String, enum: ACCESS_TAGS }],
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
    deadline: Date,
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

opportunitySchema.index({ location: "2dsphere" });
opportunitySchema.index({ status: 1, type: 1 });

export type OpportunityDoc = InferSchemaType<typeof opportunitySchema>;
export const Opportunity = model("Opportunity", opportunitySchema);
