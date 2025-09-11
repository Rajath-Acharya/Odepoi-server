import mongoose, { Schema, model, Types } from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;
  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
  });
  isConnected = true;
}

// Schemas & Models
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: String,
    avatar: String,
    skills: { type: [String], default: [] },
    joinedDate: { type: String, required: true },
    completedTrips: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: false }
);

const routePointSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    order: { type: Number, required: true },
    journeyId: { type: Schema.Types.ObjectId, ref: "Journey", required: true },
  },
  { timestamps: false }
);

const activitySchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: String,
    duration: String,
    journeyId: { type: Schema.Types.ObjectId, ref: "Journey", required: true },
  },
  { timestamps: false }
);

const staySchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    notes: String,
    journeyId: { type: Schema.Types.ObjectId, ref: "Journey", required: true },
  },
  { timestamps: false }
);

const joinRequestSchema = new Schema(
  {
    message: { type: String, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
    journeyId: { type: Schema.Types.ObjectId, ref: "Journey", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: false }
);

const journeySchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, default: "" },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    tripType: { type: String, required: true },
    maxTravelers: { type: Number, required: true },
    isPublic: { type: Boolean, default: true },
    status: { type: String, default: "planning" },
    createdAt: { type: Date, default: Date.now },
    creatorId: { type: String, ref: "User", required: true },
    // currentTravelers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: false }
);

export const UserModel = model("User", userSchema);
export const JourneyModel = model("Journey", journeySchema);
export const RoutePointModel = model("RoutePoint", routePointSchema);
export const ActivityModel = model("Activity", activitySchema);
export const StayModel = model("Stay", staySchema);
export const JoinRequestModel = model("JoinRequest", joinRequestSchema);
