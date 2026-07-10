import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getDb, COLLECTIONS, isDbConfigured } from "@/lib/mongodb";

/**
 * Cloud progress storage. The full appData blob (profiles, daily records,
 * streaks, settings) is stored per user. The client keeps localStorage as
 * the source of truth when signed out or when this endpoint is unavailable.
 */

const MAX_PAYLOAD_BYTES = 900_000; // stay well under MongoDB's 16MB doc cap

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch {
    session = null; // misconfigured auth == signed out; client stays on localStorage
  }
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not signed in" });
  }
  if (!isDbConfigured()) {
    return res
      .status(503)
      .json({ error: "Database not configured", fallback: "localStorage" });
  }

  const db = await getDb();
  if (!db) {
    return res
      .status(503)
      .json({ error: "Database unavailable", fallback: "localStorage" });
  }

  const email = session.user.email.toLowerCase();

  const account = await db.collection(COLLECTIONS.users).findOne({ email });
  if (account?.status === "deactivated") {
    return res.status(403).json({ error: "Account deactivated" });
  }

  if (req.method === "GET") {
    const doc = await db.collection(COLLECTIONS.progress).findOne({ email });
    return res.status(200).json({
      appData: doc?.appData ?? null,
      updatedAt: doc?.updatedAt ?? null,
    });
  }

  if (req.method === "PUT") {
    const { appData } = req.body || {};
    if (!appData || typeof appData !== "object") {
      return res.status(400).json({ error: "Missing appData" });
    }
    if (JSON.stringify(appData).length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({ error: "Payload too large" });
    }
    const updatedAt = new Date();
    await db.collection(COLLECTIONS.progress).updateOne(
      { email },
      { $set: { email, appData, updatedAt } },
      { upsert: true }
    );
    await db
      .collection(COLLECTIONS.events)
      .insertOne({ email, type: "sync", at: updatedAt });
    return res.status(200).json({ ok: true, updatedAt });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
