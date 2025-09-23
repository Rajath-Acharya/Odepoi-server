import mongoose from "mongoose";

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
