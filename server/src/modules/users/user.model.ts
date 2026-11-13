import { Schema, model, type InferSchemaType } from "mongoose";
import { ROLES, OPP_TYPES, ACCESS_TAGS, ORG_TYPES, SKILL_SOURCES, BBSR } from "../common/constants";

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: BBSR }, // [lng, lat] — Bhubaneswar
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "SEEKER" },

    // seeker fields
    headline: String,
    bio: String,
    photoUrl: String,
    education: String,
    college: String,
    portfolioUrl: String,
    githubUrl: String,
    linkedinUrl: String,
    locationName: String, // human-readable location label
    skills: [
      {
        _id: false,
        skill: { type: String, required: true }, // catalogue slug
        level: { type: Number, min: 1, max: 5, default: 2 },
        source: { type: String, enum: SKILL_SOURCES, default: "SELF" },
      },
    ],
    availability: {
      hoursPerWeek: { type: Number, default: 10 },
      remoteOnly: { type: Boolean, default: false },
      maxTravelKm: { type: Number, default: 15 },
    },
    accessibilityNeeds: [{ type: String, enum: ACCESS_TAGS }],
    preferences: {
      types: [{ type: String, enum: OPP_TYPES }],
      paidOnly: { type: Boolean, default: false },
      workMode: { type: String, enum: ["REMOTE", "ONSITE", "HYBRID"], default: "ONSITE" },
    },

    // organisation fields
    orgType: { type: String, enum: ORG_TYPES },
    website: String,
    description: String,
    logoUrl: String,
    contactEmail: String,
    // verification managed exclusively by admin workflows — never self-assignable
    verified: { type: Boolean, default: false },

    city: { type: String, default: "Bhubaneswar" },
    area: String, // e.g. "Patia" — shown in the UI
    location: { type: pointSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.index({ location: "2dsphere" });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
