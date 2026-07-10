import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/adminApi";
import { COLLECTIONS } from "@/lib/mongodb";

/**
 * Engagement + habit-progress analytics for the admin dashboard, computed
 * from account records, login/sync events, and synced progress blobs.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7d = new Date(now.getTime() - 7 * dayMs);
  const since30d = new Date(now.getTime() - 30 * dayMs);

  const [totalUsers, invitedUsers, deactivatedUsers] = await Promise.all([
    db.collection(COLLECTIONS.users).countDocuments({}),
    db.collection(COLLECTIONS.users).countDocuments({ status: "invited" }),
    db.collection(COLLECTIONS.users).countDocuments({ status: "deactivated" }),
  ]);

  const [active7d, active30d] = await Promise.all([
    db
      .collection(COLLECTIONS.events)
      .distinct("email", { at: { $gte: since7d } }),
    db
      .collection(COLLECTIONS.events)
      .distinct("email", { at: { $gte: since30d } }),
  ]);

  // Daily active users over the last 14 days
  const dauAgg = await db
    .collection(COLLECTIONS.events)
    .aggregate([
      { $match: { at: { $gte: new Date(now.getTime() - 14 * dayMs) } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$at" } },
            email: "$email",
          },
        },
      },
      { $group: { _id: "$_id.day", users: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  // Habit progress: walk every synced profile
  const progressDocs = await db
    .collection(COLLECTIONS.progress)
    .find({}, { projection: { email: 1, appData: 1, updatedAt: 1 } })
    .toArray();

  let totalProfiles = 0;
  let totalActivities = 0;
  let completionSamples: number[] = [];
  let streakLeaders: { email: string; profile: string; streak: number }[] = [];
  const categoryCounts: Record<string, number> = {};

  for (const doc of progressDocs) {
    const profiles = doc.appData?.profiles
      ? Object.values(doc.appData.profiles)
      : [];
    for (const prof of profiles as any[]) {
      totalProfiles += 1;
      const activities = Object.values(prof?.activities || {});
      totalActivities += activities.length;
      activities.forEach((a: any) => {
        if (a?.category)
          categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      });
      const records = Object.values(prof?.dailyRecords || {});
      records.forEach((r: any) => {
        if (typeof r?.completionRate === "number")
          completionSamples.push(r.completionRate);
      });
      if (prof?.streaks?.current > 0) {
        streakLeaders.push({
          email: doc.email,
          profile: prof.name,
          streak: prof.streaks.current,
        });
      }
    }
  }

  streakLeaders.sort((a, b) => b.streak - a.streak);
  const avgCompletion = completionSamples.length
    ? Math.round(
        completionSamples.reduce((s, v) => s + v, 0) / completionSamples.length
      )
    : 0;

  return res.status(200).json({
    accounts: {
      total: totalUsers,
      invited: invitedUsers,
      deactivated: deactivatedUsers,
      activeLast7d: active7d.length,
      activeLast30d: active30d.length,
    },
    engagement: {
      dailyActiveUsers: dauAgg.map((d) => ({ date: d._id, users: d.users })),
      syncedUsers: progressDocs.length,
    },
    habits: {
      totalProfiles,
      totalActivities,
      avgCompletionRate: avgCompletion,
      trackedDays: completionSamples.length,
      topCategories: Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([category, count]) => ({ category, count })),
      streakLeaderboard: streakLeaders.slice(0, 10),
    },
    generatedAt: now,
  });
}
