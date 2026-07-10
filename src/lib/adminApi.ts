import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Db } from "mongodb";
import { authOptions, getAdminEmails } from "@/pages/api/auth/[...nextauth]";
import { getDb, isDbConfigured } from "@/lib/mongodb";

export interface AdminContext {
  db: Db;
  adminEmail: string;
}

/**
 * Guards an admin API route: requires a signed-in session whose email is in
 * ADMIN_EMAILS, and a configured database. Returns null after writing the
 * appropriate error response if either check fails.
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AdminContext | null> {
  let session = null;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch {
    // misconfigured auth == signed out
  }
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  if (!getAdminEmails().includes(email)) {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  if (!isDbConfigured()) {
    res.status(503).json({
      error:
        "Database not configured. Set MONGODB_URI to enable the admin dashboard.",
    });
    return null;
  }
  const db = await getDb();
  if (!db) {
    res.status(503).json({ error: "Database unavailable" });
    return null;
  }
  return { db, adminEmail: email };
}
