import mongoose from "mongoose";
import { env } from "./env";

export type DbConnectionStatus = "disconnected" | "connected" | "connecting" | "disconnecting";

let memoryServerInstance: { stop: () => Promise<boolean | number> } | null = null;
let listenersRegistered = false;

function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected");
  });
}

/**
 * Returns current MongoDB connectivity state.
 */
export function getDbState(): { status: DbConnectionStatus; readyState: number } {
  const readyState = mongoose.connection.readyState;
  let status: DbConnectionStatus = "disconnected";
  if (readyState === 1) status = "connected";
  else if (readyState === 2) status = "connecting";
  else if (readyState === 3) status = "disconnecting";
  return { status, readyState };
}


/**
 * Returns true only when mongoose is actively connected (readyState === 1).
 */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Disconnects from MongoDB and stops any memory server if active.
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}

/**
 * Connects to MongoDB.
 * - Test environment: supports MONGODB_URI=memory using MongoMemoryServer.
 * - Development: supports local MongoDB or MongoDB Atlas.
 * - Production: requires MongoDB Atlas.
 * - Never silently falls back to an in-memory database when a real connection fails.
 */
export async function connectDB(uri: string): Promise<{ memory: boolean }> {
  registerConnectionListeners();

  if (uri === "memory") {
    if (env.NODE_ENV !== "test") {
      throw new Error(
        "MongoDB Memory Server is isolated to the test environment (NODE_ENV=test). " +
          "In development and production, configure a local MongoDB URI (e.g. mongodb://127.0.0.1:27017/skillbridge) " +
          "or MongoDB Atlas URI."
      );
    }

    console.log("🧪 Starting temporary MongoDB Memory Server (test environment only)…");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
    memoryServerInstance = mem;

    await mongoose.connect(mem.getUri("skillbridge"));

    const stop = async () => {
      await disconnectDB();
      process.exit(0);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);

    return { memory: true };
  }

  // Real database connection (local or Atlas) with fast fail timeout
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: env.NODE_ENV !== "production",
  });

  return { memory: false };
}

