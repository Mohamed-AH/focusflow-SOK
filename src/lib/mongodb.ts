import { MongoClient, Db } from "mongodb";

/**
 * MongoDB connection helper for the free-tier Atlas cluster.
 *
 * The app is designed to run WITHOUT a database (localStorage-only mode),
 * so every consumer must handle `getDb()` returning null gracefully.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "focusflow";

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isDbConfigured(): boolean {
  return Boolean(uri);
}

export async function getDb(): Promise<Db | null> {
  if (!uri) return null;

  if (!clientPromise) {
    if (process.env.NODE_ENV === "development") {
      // Reuse the connection across HMR reloads in dev
      if (!global._mongoClientPromise) {
        global._mongoClientPromise = new MongoClient(uri).connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      clientPromise = new MongoClient(uri).connect();
    }
  }

  const client = await clientPromise;
  return client.db(dbName);
}

/** Collection names used across the app */
export const COLLECTIONS = {
  progress: "progress", // one doc per user: { email, appData, updatedAt }
  users: "users", // account registry: { email, name, role, status, locale, currency, ... }
  orgSettings: "org_settings", // single doc: localization defaults for the deployment
  events: "events", // lightweight engagement events: { email, type, at }
} as const;
