import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/adminApi";
import { COLLECTIONS } from "@/lib/mongodb";

export const DEFAULT_ORG_SETTINGS = {
  orgName: "FocusFlow",
  locale: "en-US",
  currency: "USD",
  timezone: "UTC",
  weekStartsOn: "monday" as "monday" | "sunday",
  measurementSystem: "metric" as "metric" | "imperial",
  // Which tracking metrics are surfaced to end users, with localized labels
  trackingMetrics: [
    { key: "completionRate", label: "Completion rate", unit: "%", enabled: true },
    { key: "streak", label: "Streak", unit: "days", enabled: true },
    { key: "focusTime", label: "Focus time", unit: "min", enabled: true },
    { key: "perfectDays", label: "Perfect days", unit: "days", enabled: true },
  ],
};

/**
 * Deployment-wide localization settings (locale, currency, tracking metric
 * labels/units). GET/PUT, admin only. End users read these via
 * /api/org-settings.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const col = ctx.db.collection(COLLECTIONS.orgSettings);

  if (req.method === "GET") {
    const doc = await col.findOne({ _id: "default" as any });
    return res
      .status(200)
      .json({ settings: { ...DEFAULT_ORG_SETTINGS, ...(doc?.settings || {}) } });
  }

  if (req.method === "PUT") {
    const { settings } = req.body || {};
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Missing settings" });
    }
    const allowed = [
      "orgName",
      "locale",
      "currency",
      "timezone",
      "weekStartsOn",
      "measurementSystem",
      "trackingMetrics",
    ];
    const clean: Record<string, unknown> = {};
    for (const key of allowed) {
      if (settings[key] !== undefined) clean[key] = settings[key];
    }
    await col.updateOne(
      { _id: "default" as any },
      { $set: { settings: clean, updatedAt: new Date(), updatedBy: ctx.adminEmail } },
      { upsert: true }
    );
    return res
      .status(200)
      .json({ ok: true, settings: { ...DEFAULT_ORG_SETTINGS, ...clean } });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
