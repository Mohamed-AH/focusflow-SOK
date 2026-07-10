import type { NextApiRequest, NextApiResponse } from "next";
import { getDb, COLLECTIONS, isDbConfigured } from "@/lib/mongodb";
import { DEFAULT_ORG_SETTINGS } from "./admin/settings";

/**
 * Public read of the deployment's localization settings (locale, currency,
 * tracking metric labels). Falls back to defaults when no DB is configured.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isDbConfigured()) {
    return res.status(200).json({ settings: DEFAULT_ORG_SETTINGS, source: "defaults" });
  }
  try {
    const db = await getDb();
    const doc = await db
      ?.collection(COLLECTIONS.orgSettings)
      .findOne({ _id: "default" as any });
    return res.status(200).json({
      settings: { ...DEFAULT_ORG_SETTINGS, ...(doc?.settings || {}) },
      source: doc ? "db" : "defaults",
    });
  } catch {
    return res.status(200).json({ settings: DEFAULT_ORG_SETTINGS, source: "defaults" });
  }
}
