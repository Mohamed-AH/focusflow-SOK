import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/adminApi";
import { COLLECTIONS } from "@/lib/mongodb";

/**
 * Account management + onboarding for habit-builder customers.
 *
 * GET    -> list accounts with progress summaries
 * POST   -> onboard a new user (pre-provisioned; activates on first sign-in)
 * PATCH  -> update an account (status, role, locale, currency)
 * DELETE -> remove an account and its synced progress
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;
  const users = db.collection(COLLECTIONS.users);

  if (req.method === "GET") {
    const accounts = await users
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    // Attach a lightweight progress summary per account
    const progressDocs = await db
      .collection(COLLECTIONS.progress)
      .find({}, { projection: { email: 1, updatedAt: 1, appData: 1 } })
      .toArray();
    const byEmail = new Map(progressDocs.map((d) => [d.email, d]));

    const withSummary = accounts.map((a) => {
      const p = byEmail.get(a.email);
      const profiles = p?.appData?.profiles
        ? Object.values(p.appData.profiles)
        : [];
      let bestStreak = 0;
      let activeDays = 0;
      profiles.forEach((prof: any) => {
        bestStreak = Math.max(bestStreak, prof?.streaks?.best || 0);
        activeDays += Object.keys(prof?.dailyRecords || {}).length;
      });
      return {
        ...a,
        summary: {
          profiles: profiles.length,
          bestStreak,
          activeDays,
          lastSyncAt: p?.updatedAt ?? null,
        },
      };
    });
    return res.status(200).json({ users: withSummary });
  }

  if (req.method === "POST") {
    const { email, name, locale, currency, role } = req.body || {};
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    const existing = await users.findOne({ email: normalized });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }
    const doc = {
      email: normalized,
      name: String(name || "").trim() || normalized,
      role: role === "admin" ? "admin" : "member",
      status: "invited",
      locale: locale || null,
      currency: currency || null,
      source: "admin-onboarding",
      createdAt: new Date(),
      lastLoginAt: null,
    };
    await users.insertOne(doc as any);
    return res.status(201).json({ ok: true, user: doc });
  }

  if (req.method === "PATCH") {
    const { email, status, role, locale, currency, name } = req.body || {};
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return res.status(400).json({ error: "email required" });

    const updates: Record<string, unknown> = {};
    if (status && ["active", "invited", "deactivated"].includes(status))
      updates.status = status;
    if (role && ["member", "admin"].includes(role)) updates.role = role;
    if (locale !== undefined) updates.locale = locale;
    if (currency !== undefined) updates.currency = currency;
    if (name !== undefined) updates.name = name;
    if (!Object.keys(updates).length)
      return res.status(400).json({ error: "No valid updates" });

    const result = await users.updateOne(
      { email: normalized },
      { $set: updates }
    );
    if (!result.matchedCount)
      return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const normalized = String(req.query.email || "").trim().toLowerCase();
    if (!normalized) return res.status(400).json({ error: "email required" });
    if (normalized === ctx.adminEmail)
      return res.status(400).json({ error: "Cannot delete your own account" });
    await users.deleteOne({ email: normalized });
    await db.collection(COLLECTIONS.progress).deleteOne({ email: normalized });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
