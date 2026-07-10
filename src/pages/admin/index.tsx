import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Coins,
  Flame,
  Globe2,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Tab = "overview" | "accounts" | "onboarding" | "localization";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "INR", "JPY", "BRL", "NGN", "KES", "CAD", "AUD"];
const LOCALES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "ar-SA", label: "Arabic (Saudi Arabia)" },
  { code: "ar-EG", label: "Arabic (Egypt)" },
  { code: "de-DE", label: "German" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ja-JP", label: "Japanese" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
];

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-display font-bold text-slate-900 tabular-nums">{value}</div>
    {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  const [tab, setTab] = useState<Tab>("overview");
  const [dbError, setDbError] = useState<string | null>(null);

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Accounts
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Onboarding form
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", locale: "en-US", currency: "USD" });
  const [inviting, setInviting] = useState(false);

  // Localization settings
  const [settings, setSettings] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const handleApiError = useCallback(async (res: Response) => {
    if (res.status === 503) {
      const body = await res.json().catch(() => ({}));
      setDbError(body.error || "Database not configured.");
      return true;
    }
    return false;
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (await handleApiError(res)) return;
      if (res.ok) setAnalytics(await res.json());
    } finally {
      setAnalyticsLoading(false);
    }
  }, [handleApiError]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (await handleApiError(res)) return;
      if (res.ok) setUsers((await res.json()).users || []);
    } finally {
      setUsersLoading(false);
    }
  }, [handleApiError]);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (await handleApiError(res)) return;
    if (res.ok) setSettings((await res.json()).settings);
  }, [handleApiError]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAnalytics();
    loadUsers();
    loadSettings();
  }, [isAdmin, loadAnalytics, loadUsers, loadSettings]);

  async function onboardUser(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      if (await handleApiError(res)) return;
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Could not onboard user", description: body.error, variant: "destructive" });
        return;
      }
      toast({ title: "User onboarded", description: `${inviteForm.email} can now sign in with OAuth.` });
      setInviteForm({ email: "", name: "", locale: settings?.locale || "en-US", currency: settings?.currency || "USD" });
      loadUsers();
    } finally {
      setInviting(false);
    }
  }

  async function updateUser(email: string, updates: Record<string, unknown>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...updates }),
    });
    if (await handleApiError(res)) return;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Update failed", description: body.error, variant: "destructive" });
      return;
    }
    loadUsers();
  }

  async function deleteUser(email: string) {
    if (!window.confirm(`Delete ${email} and all their synced progress? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    if (await handleApiError(res)) return;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Delete failed", description: body.error, variant: "destructive" });
      return;
    }
    toast({ title: "Account deleted", description: email });
    loadUsers();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (await handleApiError(res)) return;
      if (res.ok) {
        toast({ title: "Localization saved", description: "New defaults apply to all users on next load." });
      }
    } finally {
      setSettingsSaving(false);
    }
  }

  // --- Gate states ---
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <GateShell>
        <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-display font-semibold text-slate-900 mb-2">Admin dashboard</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in with an administrator account to continue.</p>
        <Button onClick={() => signIn()} className="bg-electric-600 hover:bg-electric-700 text-white rounded-lg">
          Sign in
        </Button>
      </GateShell>
    );
  }

  if (!isAdmin) {
    return (
      <GateShell>
        <XCircle className="w-10 h-10 text-red-300 mx-auto mb-4" />
        <h1 className="text-xl font-display font-semibold text-slate-900 mb-2">Access restricted</h1>
        <p className="text-sm text-slate-500 mb-6">
          {session.user?.email} is not an administrator. Add this email to the{" "}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">ADMIN_EMAILS</code> environment variable to grant access.
        </p>
        <Link href="/" className="text-sm font-medium text-electric-600 hover:text-electric-700">
          ← Back to app
        </Link>
      </GateShell>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "accounts", label: "Accounts", icon: <Users className="w-4 h-4" /> },
    { key: "onboarding", label: "Onboarding", icon: <UserPlus className="w-4 h-4" /> },
    { key: "localization", label: "Localization", icon: <Globe2 className="w-4 h-4" /> },
  ];

  return (
    <>
      <Head>
        <title>Admin — FocusFlow</title>
      </Head>
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                App
              </Link>
              <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-lg text-slate-900 tracking-tight">Admin</span>
              </div>
            </div>
            <div className="text-sm text-slate-500">{session.user?.email}</div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          {dbError && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <strong className="font-semibold">Database not available.</strong> {dbError}{" "}
              See <code className="text-xs bg-amber-100 px-1.5 py-0.5 rounded">DEPLOYMENT.md</code> for MongoDB Atlas setup.
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 mb-8">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.key
                    ? "border-electric-600 text-electric-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
            <button
              onClick={() => { loadAnalytics(); loadUsers(); loadSettings(); }}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", (analyticsLoading || usersLoading) && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={<Users className="w-3.5 h-3.5" />} label="Total accounts" value={analytics?.accounts?.total ?? "—"} sub={`${analytics?.accounts?.invited ?? 0} invited · ${analytics?.accounts?.deactivated ?? 0} deactivated`} />
                <StatCard icon={<Activity className="w-3.5 h-3.5" />} label="Active (7d)" value={analytics?.accounts?.activeLast7d ?? "—"} sub={`${analytics?.accounts?.activeLast30d ?? 0} in the last 30 days`} />
                <StatCard icon={<Target className="w-3.5 h-3.5" />} label="Profiles" value={analytics?.habits?.totalProfiles ?? "—"} sub={`${analytics?.habits?.totalActivities ?? 0} activities tracked`} />
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="Avg completion" value={analytics?.habits ? `${analytics.habits.avgCompletionRate}%` : "—"} sub={`across ${analytics?.habits?.trackedDays ?? 0} tracked days`} />
                <StatCard icon={<RefreshCw className="w-3.5 h-3.5" />} label="Synced users" value={analytics?.engagement?.syncedUsers ?? "—"} sub="progress stored in cloud" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* DAU chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-display font-semibold text-slate-900 mb-4">Daily active users (14 days)</h3>
                  {analytics?.engagement?.dailyActiveUsers?.length ? (
                    <div className="flex items-end gap-1.5 h-36">
                      {analytics.engagement.dailyActiveUsers.map((d: any) => {
                        const max = Math.max(...analytics.engagement.dailyActiveUsers.map((x: any) => x.users), 1);
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0" title={`${d.date}: ${d.users} users`}>
                            <div
                              className="w-full rounded-t bg-electric-500/80 hover:bg-electric-600 transition-colors"
                              style={{ height: `${Math.max((d.users / max) * 100, 4)}%` }}
                            />
                            <span className="text-[10px] text-slate-400 truncate">{d.date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState label="No engagement events yet. Data appears once users sign in and sync." />
                  )}
                </div>

                {/* Streak leaderboard */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-display font-semibold text-slate-900 mb-4">Streak leaderboard</h3>
                  {analytics?.habits?.streakLeaderboard?.length ? (
                    <ul className="space-y-2.5">
                      {analytics.habits.streakLeaderboard.map((row: any, i: number) => (
                        <li key={`${row.email}-${row.profile}`} className="flex items-center gap-3 text-sm">
                          <span className="w-6 text-slate-400 tabular-nums">{i + 1}.</span>
                          <span className="flex-1 min-w-0">
                            <span className="font-medium text-slate-900">{row.profile}</span>
                            <span className="text-slate-400 text-xs ml-2 truncate">{row.email}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-coral-600 tabular-nums">
                            <Flame className="w-3.5 h-3.5" />
                            {row.streak}d
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState label="No active streaks yet." />
                  )}
                </div>

                {/* Top categories */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <h3 className="text-sm font-display font-semibold text-slate-900 mb-4">Top activity categories</h3>
                  {analytics?.habits?.topCategories?.length ? (
                    <div className="space-y-2">
                      {analytics.habits.topCategories.map((c: any) => {
                        const max = Math.max(...analytics.habits.topCategories.map((x: any) => x.count), 1);
                        return (
                          <div key={c.category} className="flex items-center gap-3 text-sm">
                            <span className="w-28 text-slate-600 capitalize truncate">{c.category}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-electric-500" style={{ width: `${(c.count / max) * 100}%` }} />
                            </div>
                            <span className="w-8 text-right text-slate-500 tabular-nums text-xs">{c.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState label="No synced activities yet." />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Accounts */}
          {tab === "accounts" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Locale / Currency</th>
                      <th className="px-5 py-3 font-medium">Progress</th>
                      <th className="px-5 py-3 font-medium">Last login</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.email} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-900">{u.name || u.email}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              u.status === "active" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              u.status === "invited" && "bg-sky-50 text-sky-700 border border-sky-200",
                              u.status === "deactivated" && "bg-red-50 text-red-700 border border-red-200"
                            )}
                          >
                            {u.status === "active" && <CheckCircle2 className="w-3 h-3" />}
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 capitalize">{u.role}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">
                          {(u.locale || "—") + " / " + (u.currency || "—")}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {u.summary?.profiles ? (
                            <span className="inline-flex items-center gap-2">
                              <span>{u.summary.profiles} profiles</span>
                              <span className="inline-flex items-center gap-0.5 text-coral-600">
                                <Flame className="w-3 h-3" />
                                {u.summary.bestStreak}d best
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">No sync yet</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {u.status !== "deactivated" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-slate-500 hover:text-red-600 rounded-lg"
                                onClick={() => updateUser(u.email, { status: "deactivated" })}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-slate-500 hover:text-emerald-600 rounded-lg"
                                onClick={() => updateUser(u.email, { status: "active" })}
                              >
                                Reactivate
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-lg"
                              onClick={() => deleteUser(u.email)}
                              aria-label={`Delete ${u.email}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!users.length && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                          {usersLoading ? "Loading accounts…" : "No accounts yet. Onboard a user or wait for the first OAuth sign-in."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onboarding */}
          {tab === "onboarding" && (
            <div className="max-w-xl">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-display font-semibold text-slate-900 mb-1">Onboard a habit-builder customer</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Pre-provision an account with localized defaults. The user activates it the first time
                  they sign in with OAuth using this email.
                </p>
                <form onSubmit={onboardUser} className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email" className="block mb-1.5 text-sm font-medium text-slate-900">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="customer@example.com"
                      className="rounded-lg border-slate-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-name" className="block mb-1.5 text-sm font-medium text-slate-900">Name</Label>
                    <Input
                      id="invite-name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                      className="rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invite-locale" className="block mb-1.5 text-sm font-medium text-slate-900">Locale</Label>
                      <select
                        id="invite-locale"
                        value={inviteForm.locale}
                        onChange={(e) => setInviteForm((f) => ({ ...f, locale: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        {LOCALES.map((l) => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="invite-currency" className="block mb-1.5 text-sm font-medium text-slate-900">Currency</Label>
                      <select
                        id="invite-currency"
                        value={inviteForm.currency}
                        onChange={(e) => setInviteForm((f) => ({ ...f, currency: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={inviting || !inviteForm.email}
                    className="bg-electric-600 hover:bg-electric-700 text-white rounded-lg font-medium gap-1.5"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Onboard user
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Localization */}
          {tab === "localization" && settings && (
            <div className="max-w-2xl">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-display font-semibold text-slate-900 mb-1">Localized tracking defaults</h3>
                <p className="text-sm text-slate-500 mb-6">
                  These defaults apply to every user of this deployment: display locale, currency for
                  any priced habit programs, and which tracking metrics are surfaced (with local labels).
                </p>
                <form onSubmit={saveSettings} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-slate-900">Organization name</Label>
                      <Input
                        value={settings.orgName || ""}
                        onChange={(e) => setSettings((s: any) => ({ ...s, orgName: e.target.value }))}
                        className="rounded-lg border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-slate-900">Timezone</Label>
                      <Input
                        value={settings.timezone || "UTC"}
                        onChange={(e) => setSettings((s: any) => ({ ...s, timezone: e.target.value }))}
                        placeholder="e.g. Asia/Riyadh"
                        className="rounded-lg border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-slate-900">
                        <Globe2 className="w-3.5 h-3.5 inline mr-1" />
                        Locale
                      </Label>
                      <select
                        value={settings.locale}
                        onChange={(e) => setSettings((s: any) => ({ ...s, locale: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        {LOCALES.map((l) => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-slate-900">
                        <Coins className="w-3.5 h-3.5 inline mr-1" />
                        Currency
                      </Label>
                      <select
                        value={settings.currency}
                        onChange={(e) => setSettings((s: any) => ({ ...s, currency: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-slate-900">Week starts on</Label>
                      <select
                        value={settings.weekStartsOn}
                        onChange={(e) => setSettings((s: any) => ({ ...s, weekStartsOn: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        <option value="monday">Monday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-slate-900">Measurement system</Label>
                      <select
                        value={settings.measurementSystem}
                        onChange={(e) => setSettings((s: any) => ({ ...s, measurementSystem: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        <option value="metric">Metric</option>
                        <option value="imperial">Imperial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-2 text-sm font-medium text-slate-900">Tracking metrics</Label>
                    <div className="space-y-2">
                      {(settings.trackingMetrics || []).map((m: any, i: number) => (
                        <div key={m.key} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={m.enabled}
                            onChange={(e) =>
                              setSettings((s: any) => {
                                const next = [...s.trackingMetrics];
                                next[i] = { ...next[i], enabled: e.target.checked };
                                return { ...s, trackingMetrics: next };
                              })
                            }
                            className="w-4 h-4 accent-electric-600"
                            aria-label={`Enable ${m.key}`}
                          />
                          <Input
                            value={m.label}
                            onChange={(e) =>
                              setSettings((s: any) => {
                                const next = [...s.trackingMetrics];
                                next[i] = { ...next[i], label: e.target.value };
                                return { ...s, trackingMetrics: next };
                              })
                            }
                            className="h-8 rounded-md border-slate-200 text-sm flex-1"
                            aria-label={`Label for ${m.key}`}
                          />
                          <Input
                            value={m.unit}
                            onChange={(e) =>
                              setSettings((s: any) => {
                                const next = [...s.trackingMetrics];
                                next[i] = { ...next[i], unit: e.target.value };
                                return { ...s, trackingMetrics: next };
                              })
                            }
                            className="h-8 w-20 rounded-md border-slate-200 text-sm"
                            aria-label={`Unit for ${m.key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={settingsSaving}
                    className="bg-electric-600 hover:bg-electric-700 text-white rounded-lg font-medium gap-1.5"
                  >
                    {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save localization
                  </Button>
                </form>
              </div>
            </div>
          )}

          {tab === "localization" && !settings && !dbError && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const GateShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 font-sans">
    <div className="max-w-sm w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {children}
    </div>
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="py-8 text-center text-sm text-slate-400">{label}</div>
);
