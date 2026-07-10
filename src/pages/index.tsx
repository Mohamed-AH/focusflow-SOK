import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  Flame,
  GripVertical,
  LayoutDashboard,
  LineChart,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

// --- Types & Interfaces ---
type ProfileType = "student" | "professional" | "entrepreneur" | "creative" | "mom" | "custom";

interface Activity {
  id: string;
  name: string;
  duration: number;
  startTime: number | null;
  color: string;
  icon: string;
  category: string;
  order?: number;
  isDefault?: boolean;
}

interface ActivityRecord {
  completed: boolean;
  planned: boolean;
  actualDuration: number;
  completedAt: string | null;
  focusRating: number | null;
  notes: string;
}

interface DailyRecord {
  date: string;
  activities: Record<string, ActivityRecord>;
  completionRate?: number;
  mood?: string;
}

interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  avatar: string;
  created: string;
  activities: Record<string, Activity>;
  dailyRecords: Record<string, DailyRecord>;
  streaks: {
    current: number;
    best: number;
    perfectDays: number;
    lastUpdate: string;
  };
  achievements: any[];
  preferences: {
    completionGoal: number;
    workingHours: { start: string; end: string };
    breakReminders: boolean;
    weeklyGoal: number;
    darkMode: boolean;
  };
}

import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TimePickerInput } from "@/components/ui/time-picker-input";
import { formatTime } from "@/components/ui/time-picker-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCloudSync } from "@/hooks/useCloudSync";

// --- Constants & Templates ---

const COLOR_PALETTE = {
  primary: "#4F46E5",
  secondary: "#0D9488",
  accent: "#D97706",
  success: "#059669",
  warning: "#DC2626",
  background: "#F8FAFC",
  dark: "#0F172A",
  student: "#7C3AED",
  professional: "#4F46E5",
  entrepreneur: "#D97706",
  creative: "#E11D48",
  mom: "#0D9488",
  blue: "#4F46E5",
  green: "#0D9488",
  amber: "#D97706",
  emerald: "#059669",
  red: "#DC2626",
  pink: "#E11D48",
  purple: "#7C3AED",
  cyan: "#0284C7",
  orange: "#EA580C",
};

const ACTIVITY_COLORS = [
  COLOR_PALETTE.primary,
  COLOR_PALETTE.secondary,
  COLOR_PALETTE.accent,
  COLOR_PALETTE.success,
  COLOR_PALETTE.warning,
  COLOR_PALETTE.pink,
  COLOR_PALETTE.purple,
  COLOR_PALETTE.cyan,
  COLOR_PALETTE.orange,
];

const ACTIVITY_CATEGORIES = [
  "work",
  "personal",
  "family",
  "learning",
  "academic",
  "wellness",
  "development",
  "business",
  "product",
  "marketing",
  "networking",
  "strategy",
  "creative",
  "break",
  "household",
  "social",
  "research",
];

const PROFILE_TYPES = [
  {
    key: "student",
    emoji: "👩‍🎓",
    label: "Student",
    desc: "Study sessions, classes, assignments",
    color: COLOR_PALETTE.student,
  },
  {
    key: "professional",
    emoji: "💼",
    label: "Professional",
    desc: "Deep work, meetings, development",
    color: COLOR_PALETTE.professional,
  },
  {
    key: "entrepreneur",
    emoji: "🚀",
    label: "Entrepreneur",
    desc: "Business building, product work",
    color: COLOR_PALETTE.entrepreneur,
  },
  {
    key: "creative",
    emoji: "🎨",
    label: "Creative",
    desc: "Creative work, inspiration, projects",
    color: COLOR_PALETTE.creative,
  },
  {
    key: "mom",
    emoji: "👩‍👧‍👦",
    label: "Mom",
    desc: "Family care, self-care, household management",
    color: COLOR_PALETTE.mom,
  },
  {
    key: "custom",
    emoji: "⚙️",
    label: "Custom",
    desc: "Build your own routine from scratch",
    color: COLOR_PALETTE.primary,
  },
];

// Emoji picker for activity icons (user content, not UI chrome)
const EMOJI_CATEGORIES = [
  {
    name: "Faces",
    emojis: ["😀", "😎", "🥳", "🤓", "😇", "🥰", "😴", "🤩", "😃", "😅", "😌", "😜", "😇", "🤠"],
  },
  {
    name: "Activities",
    emojis: ["🏃‍♂️", "🎨", "📚", "💻", "🧘‍♂️", "🎮", "🎸", "🏀", "🏆", "🎤", "🎬", "🎹"],
  },
  {
    name: "Objects",
    emojis: ["📱", "💡", "📖", "📝", "🕰️", "🎒", "🍳", "☕", "🏠", "📈", "📊", "🧩"],
  },
  {
    name: "Family",
    emojis: ["👩‍👧‍👦", "👨‍👩‍👧‍👦", "👩‍👧", "👨‍👦", "👶", "🧒", "👵", "👴"],
  },
];

const ACTIVITY_TEMPLATES = {
  student: {
    "study-sessions": { name: "Study Sessions", duration: 120, color: "#7C3AED", icon: "📚", category: "academic" },
    "attend-classes": { name: "Attend Classes", duration: 60, color: "#4F46E5", icon: "🎓", category: "academic" },
    "assignments": { name: "Complete Assignments", duration: 90, color: "#0D9488", icon: "✍️", category: "academic" },
    "exercise": { name: "Exercise/Break", duration: 60, color: "#D97706", icon: "🏃‍♂️", category: "wellness" },
    "personal-time": { name: "Personal Time", duration: 60, color: "#E11D48", icon: "🎮", category: "personal" },
    "social-meals": { name: "Social/Meals", duration: 60, color: "#EA580C", icon: "🍕", category: "social" }
  },
  professional: {
    "deep-work": { name: "Deep Work", duration: 120, color: "#4F46E5", icon: "💻", category: "work" },
    "meetings": { name: "Meetings", duration: 60, color: "#0D9488", icon: "👥", category: "work" },
    "email-admin": { name: "Email/Admin", duration: 30, color: "#D97706", icon: "📧", category: "work" },
    "learning": { name: "Learning/Development", duration: 60, color: "#7C3AED", icon: "📚", category: "development" },
    "lunch": { name: "Lunch Break", duration: 60, color: "#E11D48", icon: "🍽️", category: "break" },
    "personal-tasks": { name: "Personal Tasks", duration: 30, color: "#EA580C", icon: "📝", category: "personal" }
  },
  entrepreneur: {
    "business-dev": { name: "Business Development", duration: 120, color: "#D97706", icon: "📈", category: "business" },
    "product-work": { name: "Product Work", duration: 120, color: "#4F46E5", icon: "🛠️", category: "product" },
    "marketing": { name: "Marketing/Content", duration: 60, color: "#E11D48", icon: "📱", category: "marketing" },
    "networking": { name: "Networking", duration: 60, color: "#0D9488", icon: "🤝", category: "networking" },
    "planning": { name: "Planning/Strategy", duration: 60, color: "#7C3AED", icon: "🗺️", category: "strategy" },
    "self-care": { name: "Self-Care", duration: 60, color: "#EA580C", icon: "🧘‍♂️", category: "wellness" }
  },
  creative: {
    "creative-work": { name: "Creative Work", duration: 180, color: "#E11D48", icon: "🎨", category: "creative" },
    "research": { name: "Research/Inspiration", duration: 60, color: "#7C3AED", icon: "🔍", category: "research" },
    "admin-tasks": { name: "Admin/Business Tasks", duration: 60, color: "#4F46E5", icon: "📊", category: "business" },
    "skill-dev": { name: "Skill Development", duration: 60, color: "#0D9488", icon: "🎯", category: "learning" },
    "breaks": { name: "Breaks/Recharge", duration: 60, color: "#D97706", icon: "☕", category: "break" },
    "life-maintenance": { name: "Life Maintenance", duration: 60, color: "#EA580C", icon: "🏠", category: "personal" }
  },
  mom: {
    "morning-routine": { name: "Morning Routine", duration: 45, color: "#D97706", icon: "☀️", category: "personal" },
    "kids-prep": { name: "Kids Prep & School", duration: 60, color: "#4F46E5", icon: "🎒", category: "family" },
    "meal-prep": { name: "Meal Prep & Cooking", duration: 90, color: "#0D9488", icon: "🍳", category: "household" },
    "self-care": { name: "Self-Care Time", duration: 45, color: "#E11D48", icon: "💆‍♀️", category: "personal" },
    "learning": { name: "Learning/Personal Growth", duration: 60, color: "#7C3AED", icon: "📚", category: "development" },
    "family-calls": { name: "Family Calls/Relatives", duration: 30, color: "#EA580C", icon: "📞", category: "social" },
    "household": { name: "Household Management", duration: 60, color: "#0284C7", icon: "🏠", category: "household" },
    "family-time": { name: "Evening Family Time", duration: 90, color: "#DC2626", icon: "👨‍👩‍👧‍👦", category: "family" }
  }
};

// --- Utility Functions ---

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDayOfWeek(dateStr: string) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

function getCompletionRate(profile: any) {
  const today = getTodayDate();
  const record = profile?.dailyRecords?.[today];
  return record?.completionRate ?? 0;
}

function getCurrentStreak(profile: Profile) {
  return profile?.streaks?.current ?? 0;
}

function getActivitiesForToday(profile: Profile) {
  if (!profile?.activities) return [];
  return Object.values(profile.activities).sort((a: Activity, b: Activity) => (a.order || 0) - (b.order || 0));
}

// --- Local Storage Logic ---

const STORAGE_KEY = "focusflow_app_data";
const STORAGE_VERSION = "1.0";
const DEBOUNCE_DELAY = 500;

interface AppData {
  version: string;
  profiles: Record<string, Profile>;
  settings: {
    currentProfile: string | null;
    theme: string;
    notifications: boolean;
    sound: boolean;
    language: string;
  };
  app: {
    firstLaunch: string;
    totalSessions: number;
    lastBackup: string | null;
  };
}

function getInitialData(): AppData {
  return {
    version: STORAGE_VERSION,
    profiles: {},
    settings: {
      currentProfile: null,
      theme: "light",
      notifications: true,
      sound: true,
      language: "en",
    },
    app: {
      firstLaunch: getTodayDate(),
      totalSessions: 0,
      lastBackup: null,
    },
  };
}

function validateProfile(profile: Partial<Profile>) {
  if (!profile) return false;
  if (!profile.id || !profile.name || !profile.type) return false;
  if (typeof profile.name !== "string" || profile.name.length < 1 || profile.name.length > 20) return false;
  if (!PROFILE_TYPES.some((t) => t.key === profile.type)) return false;
  return true;
}

function validateAppData(data: any) {
  if (!data || typeof data !== "object") return false;
  if (data.version !== STORAGE_VERSION) return false;
  if (!data.profiles || typeof data.profiles !== "object") return false;
  if (!data.settings || typeof data.settings !== "object") return false;
  return true;
}

import ProgressRing from "@/components/ui/ProgressRing";
import WeeklyOverview from "@/components/ui/WeeklyOverview";
import MonthlyHeatmap from "@/components/ui/MonthlyHeatmap";

// --- Activity Card Component ---
const ActivityCard = ({
  activity,
  state = "planned",
  onCheck,
  onEdit,
  onDelete,
  dragHandleProps,
  darkMode = false,
}: {
  activity: any;
  state?: "planned" | "inprogress" | "completed";
  onCheck?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: any;
  darkMode?: boolean;
}) => {
  const accent = activity.color || COLOR_PALETTE.primary;
  const completed = state === "completed";

  return (
    <motion.div
      className={cn(
        "group flex flex-row items-center w-full rounded-lg border px-4 py-3.5 mb-2 transition-colors",
        darkMode
          ? completed
            ? "bg-ocean-800/60 border-ocean-700"
            : "bg-ocean-800 border-ocean-700 hover:border-ocean-600"
          : completed
            ? "bg-slate-50 border-slate-200"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      layout
      tabIndex={0}
      aria-label={`Activity: ${activity.name}`}
      onDoubleClick={onEdit}
      onContextMenu={e => {
        e.preventDefault();
        if (onEdit) onEdit();
      }}
    >
      {/* Accent bar */}
      <div
        className="w-1 self-stretch rounded-full mr-3 shrink-0"
        style={{ background: accent, opacity: completed ? 0.35 : 1 }}
        aria-hidden="true"
      />

      {/* Checkbox */}
      <button
        className={cn(
          "w-6 h-6 flex items-center justify-center rounded-md border mr-3 shrink-0 transition-colors",
          completed
            ? "border-electric-600 bg-electric-600 text-white"
            : darkMode
              ? "border-ocean-500 bg-transparent hover:border-electric-400"
              : "border-slate-300 bg-white hover:border-electric-500"
        )}
        aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
        onClick={onCheck}
        tabIndex={0}
      >
        {completed && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>

      {/* Name, duration, category */}
      <div className="flex-1 flex flex-col min-w-0 cursor-pointer" onClick={onEdit}>
        <span
          className={cn(
            "text-sm font-medium truncate",
            completed
              ? darkMode ? "text-ocean-400 line-through" : "text-slate-400 line-through"
              : darkMode ? "text-white" : "text-slate-900"
          )}
        >
          {activity.name}
        </span>
        <div className={cn("flex items-center gap-2 mt-0.5 text-xs", darkMode ? "text-ocean-400" : "text-slate-500")}>
          <span className="tabular-nums">{activity.duration} min</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{activity.category}</span>
          {activity.startTime && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatTime(activity.startTime)}</span>
            </>
          )}
        </div>
      </div>

      {/* Icon + hover actions */}
      <div className="flex flex-row items-center gap-1 ml-3">
        <span className="text-xl mr-1" aria-label="Activity icon">{activity.icon}</span>
        <div className="flex flex-row items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            className={cn(
              "p-1.5 rounded-md transition-colors",
              darkMode ? "text-ocean-400 hover:text-white hover:bg-ocean-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            )}
            aria-label="Edit activity"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            tabIndex={0}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className={cn(
              "p-1.5 rounded-md transition-colors",
              darkMode ? "text-ocean-400 hover:text-red-400 hover:bg-ocean-700" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
            )}
            aria-label="Delete activity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            tabIndex={0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            {...dragHandleProps}
            className={cn(
              "p-1.5 rounded-md cursor-grab active:cursor-grabbing transition-colors",
              darkMode ? "text-ocean-400 hover:text-white hover:bg-ocean-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            )}
            aria-label="Reorder activity"
            tabIndex={0}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Analytics Modal Component ---
const AnalyticsModal = ({ isOpen, onClose, profile }: { isOpen: boolean; onClose: () => void; profile: Profile | null }) => {
  if (!profile) return null;
  const darkMode = profile.preferences?.darkMode || false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] w-full h-[95vh] sm:h-[90vh] p-0 overflow-hidden gap-0 bg-ocean-950 border border-ocean-800 shadow-2xl rounded-xl">
        <DashboardLayout profile={profile} onClose={onClose} darkMode={darkMode} />
      </DialogContent>
    </Dialog>
  );
};

// --- Settings Modal Component ---
const SettingsModal = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdateProfile: (updates: Partial<Profile>) => void;
}) => {
  if (!profile) return null;

  const [completionGoal, setCompletionGoal] = React.useState(profile.preferences.completionGoal);
  const [darkMode, setDarkMode] = React.useState(profile.preferences.darkMode || false);

  // Sync state when profile changes or modal opens
  React.useEffect(() => {
    if (profile && isOpen) {
      setCompletionGoal(profile.preferences.completionGoal);
      setDarkMode(profile.preferences.darkMode || false);
    }
  }, [profile, isOpen]);

  const handleSave = () => {
    onUpdateProfile({
      preferences: {
        ...profile.preferences,
        completionGoal: completionGoal,
        darkMode: darkMode,
      },
    });
    toast({
      title: "Settings saved",
      description: `Your preferences have been updated.`
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-xl p-0 overflow-hidden bg-white border border-slate-200 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-lg font-display font-semibold text-slate-900">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Customize your FocusFlow experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Profile Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="w-11 h-11 text-2xl bg-white border border-slate-200 rounded-lg flex items-center justify-center">
              {profile.avatar}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{profile.name}</div>
              <div className="text-xs text-slate-500 capitalize">{profile.type} profile</div>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div>
              <div className="font-medium text-slate-900 text-sm">Dark mode</div>
              <div className="text-xs text-slate-500">Switch between light and dark theme</div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                darkMode ? "bg-electric-600" : "bg-slate-200"
              )}
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                initial={false}
                animate={{ x: darkMode ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Completion Goal Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="completion-goal" className="text-sm font-medium text-slate-900">
                Daily completion goal
              </Label>
              <span className="text-lg font-display font-semibold text-electric-600 tabular-nums">{completionGoal}%</span>
            </div>
            <p className="text-xs text-slate-500">
              Complete at least this percentage of activities to maintain your streak.
            </p>
            <input
              id="completion-goal"
              type="range"
              min="50"
              max="100"
              step="5"
              value={completionGoal}
              onChange={(e) => setCompletionGoal(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-electric-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="text-sm font-medium text-slate-900">Profile statistics</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Current streak", value: `${profile.streaks.current} days` },
                { label: "Best streak", value: `${profile.streaks.best} days` },
                { label: "Perfect days", value: String(profile.streaks.perfectDays) },
                { label: "Activities", value: String(Object.keys(profile.activities).length) },
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                  <div className="text-base font-display font-semibold text-slate-900 tabular-nums">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 flex flex-row justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-lg px-4 text-slate-600 hover:text-slate-900">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-electric-600 hover:bg-electric-700 text-white rounded-lg px-6 font-medium"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Share Achievement Component ---
const ShareAchievement = ({ profile, onClose }: { profile: any; onClose: () => void }) => {
  const today = getTodayDate();
  const completionRate = getCompletionRate(profile);
  const streak = getCurrentStreak(profile);

  const generateShareText = () => {
    return `FocusFlow Progress Update\n\n${today}\n${completionRate}% complete\n${streak} day streak\n`;
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          text: text
        });
        toast({ title: "Shared!", description: "Your progress has been shared." });
      } catch (err) {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Share your progress with others." });
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Share your progress with others." });
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] rounded-xl p-0 overflow-hidden bg-white border border-slate-200 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-lg font-display font-semibold text-slate-900">
            <Share2 className="w-5 h-5 text-slate-400" />
            Share your progress
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Show off today&apos;s achievements
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Preview Card */}
          <div className="rounded-xl bg-ocean-900 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 text-xl bg-ocean-800 border border-ocean-700 rounded-lg flex items-center justify-center">
                  {profile.avatar}
                </div>
                <div>
                  <div className="font-display font-semibold text-white text-sm">{profile.name}</div>
                  <div className="text-xs text-ocean-400">FocusFlow</div>
                </div>
              </div>
              <div className="text-xs text-ocean-400 tabular-nums">{today}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-ocean-800 rounded-lg p-4 border border-ocean-700">
                <div className="text-xs text-ocean-400 mb-1">Completion</div>
                <div className="text-2xl font-display font-bold text-white tabular-nums">
                  {completionRate}<span className="text-base font-medium text-ocean-300">%</span>
                </div>
              </div>
              <div className="bg-ocean-800 rounded-lg p-4 border border-ocean-700">
                <div className="text-xs text-ocean-400 mb-1">Streak</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-display font-bold text-white tabular-nums">{streak}</span>
                  <Flame className="w-5 h-5 text-coral-500" />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-ocean-800 text-xs text-ocean-500 text-center">
              Track habits. Build streaks. Stay focused.
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 rounded-lg text-slate-600 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-electric-600 hover:bg-electric-700 text-white rounded-lg font-medium"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Auth / Sync Controls ---
const SyncBadge = ({ syncStatus, darkMode }: { syncStatus: string; darkMode?: boolean }) => {
  const config: Record<string, { icon: React.ReactNode; label: string }> = {
    local: { icon: <CloudOff className="w-3.5 h-3.5" />, label: "Local only" },
    syncing: { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: "Syncing" },
    synced: { icon: <Cloud className="w-3.5 h-3.5" />, label: "Synced" },
    error: { icon: <CloudOff className="w-3.5 h-3.5" />, label: "Sync error" },
  };
  const { icon, label } = config[syncStatus] || config.local;
  return (
    <span
      className={cn(
        "hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        syncStatus === "synced"
          ? "text-emerald-700 border-emerald-200 bg-emerald-50"
          : syncStatus === "error"
            ? "text-red-700 border-red-200 bg-red-50"
            : darkMode
              ? "text-ocean-300 border-ocean-700 bg-ocean-800"
              : "text-slate-500 border-slate-200 bg-slate-50"
      )}
      title={
        syncStatus === "local"
          ? "Progress is saved in this browser. Sign in to sync across devices."
          : `Cloud sync: ${label}`
      }
    >
      {icon}
      {label}
    </span>
  );
};

// --- Main App Component ---

export default function FocusFlow() {
  // State
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{ name: string; avatar: string; type: ProfileType }>({
    name: "",
    avatar: "😀",
    type: "student" as ProfileType,
  });
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [authProviders, setAuthProviders] = useState<string[]>([]);

  // Activity modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState<any>(null); // null = add, object = edit
  const [activityEditId, setActivityEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Cloud sync (no-op when signed out or DB not configured)
  const { syncStatus, signedIn, session } = useCloudSync(appData, setAppData);
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  // Debounce save
  const saveTimeout = useRef<any>(null);

  // Discover configured OAuth providers (empty when OAuth env vars unset)
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => (res.ok ? res.json() : {}))
      .then((providers) => setAuthProviders(Object.keys(providers || {})))
      .catch(() => setAuthProviders([]));
  }, []);

  // Load from localStorage
  useEffect(() => {
    setLoading(true);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      let data = raw ? JSON.parse(raw) : null;
      if (!validateAppData(data)) {
        data = getInitialData();
      }

      // Migration: Add darkMode to existing profiles if missing
      if (data && data.profiles) {
        Object.keys(data.profiles).forEach(profileId => {
          const profile = data.profiles[profileId];
          if (profile.preferences && profile.preferences.darkMode === undefined) {
            profile.preferences.darkMode = false;
          }
        });
      }

      setAppData(data);
    } catch (e: any) {
      setAppData(getInitialData());
      setStorageError("Could not load data. Private browsing or storage error?");
    }
    setLoading(false);
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!appData) return;
    if (saving) return;
    setSaving(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        setStorageError(null);
      } catch (e: any) {
        setStorageError("Storage error: " + (e?.message || "Quota exceeded or private mode"));
      }
      setSaving(false);
    }, DEBOUNCE_DELAY);
    // eslint-disable-next-line
  }, [appData]);

  // --- Profile Management ---

  function handleCreateProfile() {
    const id = generateUUID();
    const now = new Date().toISOString();
    // Load template activities
    const template = ACTIVITY_TEMPLATES[createForm.type as keyof typeof ACTIVITY_TEMPLATES] || {};
    const activities: any = {};
    let order = 1;
    Object.entries(template).forEach(([key, val]: any) => {
      const actId = generateUUID();
      activities[actId] = {
        id: actId,
        name: val.name,
        duration: val.duration,
        color: val.color,
        icon: val.icon,
        category: val.category,
        isDefault: true,
        order: order++,
      };
    });
    const newProfile = {
      id,
      name: createForm.name.trim(),
      avatar: createForm.avatar,
      type: createForm.type,
      created: now,
      activities,
      dailyRecords: {},
      streaks: { current: 0, best: 0, perfectDays: 0, lastUpdate: getTodayDate() },
      achievements: [],
      preferences: {
        completionGoal: 70,
        workingHours: { start: "06:00", end: "22:00" },
        breakReminders: true,
        weeklyGoal: 35,
        darkMode: false,
      },
    };
    if (!validateProfile(newProfile)) {
      toast({ title: "Invalid profile", description: "Please check your inputs.", variant: "destructive" });
      return;
    }
    setAppData((prev: AppData) => {
      const updated = {
        ...prev,
        profiles: { ...prev.profiles, [id]: newProfile },
        settings: { ...prev.settings, currentProfile: id },
      };
      return updated;
    });
    setShowCreateModal(false);
    setCreateForm({ name: "", avatar: "😀", type: "student" as ProfileType });
    toast({ title: "Profile created!", description: `Welcome, ${newProfile.name}!` });
  }

  function handleProfileSwitch(id: string) {
    setAppData((prev: AppData) => ({
      ...prev,
      settings: { ...prev.settings, currentProfile: id },
    }));
  }

  function handleUpdateProfile(updates: Partial<Profile>) {
    setAppData((prev: AppData) => {
      const profileId = prev?.settings?.currentProfile;
      if (!profileId) return prev;

      const currentProfile = prev.profiles[profileId];
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        preferences: {
          ...currentProfile.preferences,
          ...(updates.preferences || {}),
        },
      };

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profileId]: updatedProfile,
        },
      };
    });
  }

  // --- Activity Completion (toggles completed state in dailyRecords) ---
  function handleToggleActivity(activityId: string) {
    const today = getTodayDate();
    setAppData((prev: any) => {
      const profileId = prev?.settings?.currentProfile;
      if (!profileId) return prev;
      const profile = prev.profiles[profileId];
      const daily = { ...(profile.dailyRecords?.[today] || { date: today, activities: {} }) };
      const act = daily.activities?.[activityId] || {};
      const completed = !act.completed;
      daily.activities = {
        ...daily.activities,
        [activityId]: {
          ...act,
          planned: true,
          completed,
          actualDuration: completed ? profile.activities[activityId].duration : 0,
          completedAt: completed ? new Date().toISOString() : null,
          focusRating: completed ? 4 : null,
          notes: act.notes || "",
        },
      };
      // Calculate completion rate
      const total = Object.keys(profile.activities).length;
      const done = Object.values(daily.activities).filter((a: any) => a.completed).length;
      daily.completionRate = total ? Math.round((done / total) * 100) : 0;
      daily.totalPlannedTime = Object.values(profile.activities).reduce((sum: number, a: any) => sum + (a.duration || 0), 0);
      daily.totalCompletedTime = Object.values(daily.activities).reduce((sum: number, a: any) => sum + (a.completed ? a.actualDuration || 0 : 0), 0);

      // Alert user when completion rate is close to the goal threshold
      const completionGoal = profile.preferences?.completionGoal || 70;
      if (daily.completionRate >= 60 && daily.completionRate < completionGoal) {
        toast({
          title: "Almost there!",
          description: `You're at ${daily.completionRate}%. Just a bit more to reach ${completionGoal}% and maintain your streak.`,
          variant: "destructive"
        });
      }
      // Streak logic (simple for demo)
      let streaks = { ...profile.streaks };
      if (daily.completionRate >= (profile.preferences?.completionGoal || 70)) {
        if (streaks.lastUpdate !== today) {
          streaks.current = (streaks.current || 0) + 1;
          streaks.best = Math.max(streaks.best || 0, streaks.current);
          streaks.lastUpdate = today;
          toast({
            title: "Streak increased!",
            description: `You've maintained a ${streaks.current} day streak.`,
            variant: "default"
          });
        }
      } else {
        if (streaks.lastUpdate !== today) {
          streaks.current = 0;
          streaks.lastUpdate = today;
          toast({
            title: "Streak at risk",
            description: "Keep your daily completion above your goal to maintain your streak.",
            variant: "destructive"
          });
        }
      }
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profileId]: {
            ...profile,
            dailyRecords: { ...profile.dailyRecords, [today]: daily },
            streaks,
          },
        },
      };
    });
  }

  // --- Activity Management ---
  function handleAddActivity() {
    setActivityEditId(null);
    setActivityForm({
      name: "",
      duration: 30,
      startTime: null,
      category: "personal",
      color: ACTIVITY_COLORS[0],
      icon: "📝",
    });
    setShowActivityModal(true);
  }

  function handleEditActivity(activity: any) {
    setActivityEditId(activity.id);
    setActivityForm({
      name: activity.name,
      duration: activity.duration,
      startTime: activity.startTime || null,
      category: activity.category,
      color: activity.color,
      icon: activity.icon,
    });
    setShowActivityModal(true);
  }

  function handleSaveActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityForm.name || activityForm.name.length > 50) {
      toast({ title: "Invalid name", description: "Name is required (max 50 chars)", variant: "destructive" });
      return;
    }
    if (activityForm.duration < 15 || activityForm.duration > 480) {
      toast({ title: "Invalid duration", description: "Duration must be 15-480 minutes", variant: "destructive" });
      return;
    }
    if (!activityForm.category) {
      toast({ title: "Category required", description: "Please select a category", variant: "destructive" });
      return;
    }
    if (!activityForm.icon) {
      toast({ title: "Icon required", description: "Please pick an emoji", variant: "destructive" });
      return;
    }
    setAppData((prev: any) => {
      const profileId = prev?.settings?.currentProfile;
      if (!profileId) return prev;
      const profile = prev.profiles[profileId];
      let activities = { ...profile.activities };
      if (activityEditId) {
        // Edit
        activities[activityEditId] = {
          ...activities[activityEditId],
          ...activityForm,
        };
      } else {
        // Add
        const newId = generateUUID();
        const maxOrder = Math.max(0, ...Object.values(activities).map((a: any) => a.order || 0));
        activities[newId] = {
          id: newId,
          ...activityForm,
          isDefault: false,
          order: maxOrder + 1,
        };
      }
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profileId]: {
            ...profile,
            activities,
          },
        },
      };
    });
    setShowActivityModal(false);
    setActivityForm(null);
    setActivityEditId(null);
    toast({ title: "Activity saved", description: "Your activity was saved!" });
  }

  function handleDeleteActivity(activityId: string) {
    setAppData((prev: any) => {
      const profileId = prev?.settings?.currentProfile;
      if (!profileId) return prev;
      const profile = prev.profiles[profileId];
      const activities = { ...profile.activities };
      delete activities[activityId];
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profileId]: {
            ...profile,
            activities,
          },
        },
      };
    });
    setDeleteConfirmId(null);
    toast({ title: "Activity deleted", description: "The activity was removed." });
  }

  function handleReorderActivities(result: DropResult) {
    if (!result.destination) return;
    const profileId = appData?.settings?.currentProfile;
    if (!profileId) return;
    const profile = appData.profiles[profileId];
    const activitiesArr = getActivitiesForToday(profile);
    const [removed] = activitiesArr.splice(result.source.index, 1);
    activitiesArr.splice(result.destination.index, 0, removed);
    // Update order
    const newActivities: any = {};
    activitiesArr.forEach((a: any, idx: number) => {
      newActivities[a.id] = { ...a, order: idx + 1 };
    });
    setAppData((prev: any) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [profileId]: {
          ...profile,
          activities: newActivities,
        },
      },
    }));
  }

  // --- UI Render ---

  // Profile List
  const profiles: Profile[] = appData?.profiles ? Object.values(appData.profiles) : [];
  const currentProfileId = appData?.settings?.currentProfile;
  const currentProfile = currentProfileId ? appData?.profiles?.[currentProfileId] : null;
  const darkMode = currentProfile?.preferences?.darkMode || false;

  // --- Accessibility: Focus trap for modal ---
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showCreateModal && modalRef.current) {
      const firstInput = modalRef.current.querySelector("input");
      if (firstInput) (firstInput as HTMLInputElement).focus();
    }
  }, [showCreateModal]);

  const authControls = (
    <div className="flex items-center gap-2">
      <SyncBadge syncStatus={signedIn ? syncStatus : "local"} darkMode={darkMode} />
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            darkMode ? "text-ocean-300 hover:text-white hover:bg-ocean-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Admin
        </Link>
      )}
      {authProviders.length > 0 && (
        signedIn ? (
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className={cn(
              "gap-1.5 rounded-lg text-sm font-medium",
              darkMode ? "text-ocean-300 hover:text-white hover:bg-ocean-800" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        ) : (
          <Button
            onClick={() => signIn()}
            className="gap-1.5 rounded-lg bg-electric-600 hover:bg-electric-700 text-white text-sm font-medium"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </Button>
        )
      )}
    </div>
  );

  // --- Main Render ---
  return (
    <>
      <Head>
        <title>FocusFlow — Habit tracking for focused teams and people</title>
        <meta name="description" content="Track habits, build streaks, and stay focused. FocusFlow is a clean, fast habit tracker with cloud sync and analytics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={cn("min-h-screen font-sans", darkMode ? "bg-ocean-950" : "bg-slate-50")}>
        {/* If no profile selected, show onboarding */}
        {!currentProfile ? (
          <div className="w-full min-h-screen bg-white font-sans">
            {/* Nav */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-electric-600 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-white" size={18} />
                  </div>
                  <span className="font-display font-bold text-lg text-slate-900 tracking-tight">FocusFlow</span>
                </div>
                <div className="flex items-center gap-3">
                  {authProviders.length > 0 && !signedIn && (
                    <Button
                      variant="ghost"
                      onClick={() => signIn()}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                    >
                      Sign in
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium px-4"
                  >
                    Get started
                  </Button>
                </div>
              </div>
            </header>

            {/* Hero */}
            <section className="relative w-full px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <motion.div
                    className="space-y-7"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-50 border border-electric-100 text-xs font-medium text-electric-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      Now with cloud sync and team analytics
                    </span>

                    <h1 className="text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-[1.05] tracking-tight">
                      The habit tracker built for how you actually work
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                      Plan your day, check off activities, and watch streaks compound.
                      Works instantly in your browser — sign in to sync across devices.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="h-12 px-6 bg-electric-600 hover:bg-electric-700 text-white font-medium text-base rounded-lg shadow-sm"
                        aria-label="Start tracking your habits"
                      >
                        Start tracking — it&apos;s free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      {authProviders.length > 0 && !signedIn && (
                        <Button
                          variant="outline"
                          onClick={() => signIn()}
                          className="h-12 px-6 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-base rounded-lg"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign in to sync
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                      {[
                        "No account required",
                        "Works offline",
                        "Multiple profiles",
                        "Visual analytics",
                      ].map((text, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {text}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Product visual */}
                  <motion.div
                    className="hidden lg:block"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  >
                    <div className="relative rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="text-sm font-medium text-slate-900">Today&apos;s progress</div>
                          <div className="text-xs text-slate-500">Thursday</div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-coral-50 border border-coral-100 text-xs font-semibold text-coral-600">
                          <Flame className="w-3.5 h-3.5" />
                          12 day streak
                        </span>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="relative w-40 h-40 shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="85" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                            <motion.circle
                              cx="100" cy="100" r="85" fill="none"
                              stroke="#4f46e5" strokeWidth="14" strokeLinecap="round"
                              strokeDasharray="534"
                              initial={{ strokeDashoffset: 534 }}
                              animate={{ strokeDashoffset: 534 * 0.25 }}
                              transition={{ duration: 1.6, ease: "easeOut", delay: 0.6 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-display font-bold text-slate-900 tabular-nums">75%</span>
                            <span className="text-xs text-slate-500">complete</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2.5">
                          {[
                            { name: "Deep Work", done: true },
                            { name: "Team standup", done: true },
                            { name: "Learning", done: true },
                            { name: "Exercise", done: false },
                          ].map((item, i) => (
                            <motion.div
                              key={i}
                              className="flex items-center gap-2.5 text-sm"
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.8 + i * 0.12 }}
                            >
                              <span className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center",
                                item.done ? "bg-electric-600 border-electric-600 text-white" : "border-slate-300"
                              )}>
                                {item.done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                              </span>
                              <span className={cn(item.done ? "text-slate-400 line-through" : "text-slate-700")}>
                                {item.name}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="w-full px-6 py-20 bg-slate-50 border-y border-slate-200">
              <div className="max-w-6xl mx-auto">
                <div className="max-w-2xl mb-14">
                  <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight mb-4">
                    Everything you need to stay consistent
                  </h2>
                  <p className="text-lg text-slate-600">
                    No fluff, no fake promises. Here&apos;s what FocusFlow does.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      icon: <LayoutDashboard className="w-5 h-5" />,
                      title: "Daily progress at a glance",
                      desc: "Check off activities and watch your completion ring fill in real time. Weekly and monthly views show your patterns.",
                    },
                    {
                      icon: <Flame className="w-5 h-5" />,
                      title: "Streaks that motivate",
                      desc: "Hit your daily goal to extend your streak. Track your current run, best ever, and perfect days.",
                    },
                    {
                      icon: <Users className="w-5 h-5" />,
                      title: "Profiles for every role",
                      desc: "Student, professional, founder, creative, parent — separate routines for the different parts of your life.",
                    },
                    {
                      icon: <LineChart className="w-5 h-5" />,
                      title: "Analytics that teach you",
                      desc: "Activity leaderboards, category performance, time-of-day heatmaps, and week-over-week trends.",
                    },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      className="rounded-xl bg-white border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-electric-50 text-electric-600 flex items-center justify-center mb-4">
                        {f.icon}
                      </div>
                      <h3 className="text-base font-display font-semibold text-slate-900 mb-2">{f.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* For teams strip */}
                <motion.div
                  className="mt-6 rounded-xl bg-ocean-900 p-8 lg:p-10 grid lg:grid-cols-[1fr_auto] gap-6 items-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4 }}
                >
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-electric-300 uppercase tracking-wider mb-3">
                      <TrendingUp className="w-3.5 h-3.5" />
                      For coaches &amp; teams
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">
                      Run habit programs for your clients
                    </h3>
                    <p className="text-ocean-300 max-w-2xl">
                      Onboard members, localize currencies and tracking metrics for any market,
                      and monitor engagement and habit progress from the built-in admin dashboard.
                    </p>
                  </div>
                  {authProviders.length > 0 && (
                    <Button
                      onClick={() => signIn()}
                      className="h-11 px-6 bg-white text-slate-900 hover:bg-slate-100 font-medium rounded-lg whitespace-nowrap"
                    >
                      Sign in to get started
                    </Button>
                  )}
                </motion.div>
              </div>
            </section>

            {/* CTA + existing profiles */}
            <section className="w-full px-6 py-20">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight mb-4">
                  Ready to build better habits?
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  Create a profile and start tracking in under a minute. No signup required.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="h-12 px-8 bg-electric-600 hover:bg-electric-700 text-white font-medium text-base rounded-lg shadow-sm"
                  aria-label="Create your first profile"
                >
                  Create your first profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {profiles.length > 0 && (
                  <div className="mt-16 pt-12 border-t border-slate-200 text-left">
                    <h3 className="text-lg font-display font-semibold text-slate-900 mb-4">Your profiles</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {profiles.map((profile: any) => (
                        <button
                          key={profile.id}
                          className="group flex items-center gap-3 p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-left"
                          onClick={() => handleProfileSwitch(profile.id)}
                        >
                          <Avatar className="w-10 h-10 border border-slate-200">
                            <AvatarFallback
                              className="flex h-full w-full items-center justify-center rounded-full text-xl text-white"
                              style={{ background: COLOR_PALETTE[profile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary }}
                            >
                              {profile.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 text-sm truncate">{profile.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <Flame className="w-3 h-3 text-coral-500" /> {getCurrentStreak(profile)}d
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 text-electric-500" /> {getCompletionRate(profile)}%
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loading && <div className="mt-8 text-slate-400 text-sm">Loading…</div>}
                {storageError && (
                  <div className="mt-8 text-red-600 text-sm" role="alert">{storageError}</div>
                )}
              </div>
            </section>

            <footer className="w-full border-t border-slate-200 py-8 px-6">
              <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
                <span>&copy; {new Date().getFullYear()} FocusFlow</span>
                <span>Track habits. Build streaks. Stay focused.</span>
              </div>
            </footer>
          </div>
        ) : (
          // --- Main App (desktop-first shell) ---
          <div className={cn("min-h-screen", darkMode ? "bg-ocean-950" : "bg-slate-50")}>
            {/* App Header */}
            <header className={cn(
              "sticky top-0 z-40 w-full border-b backdrop-blur",
              darkMode ? "bg-ocean-950/90 border-ocean-800" : "bg-white/90 border-slate-200"
            )}>
              <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 h-16 gap-4">
                {/* Left: brand + profile switcher */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-electric-600 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className={cn("font-display font-bold text-lg tracking-tight hidden sm:block", darkMode ? "text-white" : "text-slate-900")}>
                      FocusFlow
                    </span>
                  </div>
                  <div className={cn("h-6 w-px hidden sm:block", darkMode ? "bg-ocean-800" : "bg-slate-200")} aria-hidden="true" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors min-w-0",
                          darkMode ? "hover:bg-ocean-800" : "hover:bg-slate-100"
                        )}
                        aria-label="Switch profile"
                      >
                        <Avatar className="w-7 h-7">
                          <AvatarFallback
                            className="flex h-full w-full items-center justify-center rounded-full text-base text-white"
                            style={{ background: COLOR_PALETTE[currentProfile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary }}
                          >
                            {currentProfile.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn("font-medium text-sm truncate max-w-[140px]", darkMode ? "text-white" : "text-slate-900")}>
                          {currentProfile.name}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 shrink-0", darkMode ? "text-ocean-400" : "text-slate-400")} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={cn("w-56 rounded-lg", darkMode && "bg-ocean-900 border-ocean-700")}>
                      {profiles.map((profile: Profile) => (
                        <button
                          key={profile.id}
                          className={cn(
                            "flex flex-row items-center w-full px-2 py-2 rounded-md text-sm",
                            darkMode ? "text-white" : "text-slate-700",
                            currentProfileId === profile.id
                              ? darkMode ? "bg-electric-600/20" : "bg-electric-50"
                              : darkMode ? "hover:bg-ocean-800" : "hover:bg-slate-100"
                          )}
                          onClick={() => handleProfileSwitch(profile.id)}
                          aria-label={`Switch to profile ${profile.name}`}
                        >
                          <span className="mr-2 text-base">{profile.avatar}</span>
                          <span className="truncate">{profile.name}</span>
                          {currentProfileId === profile.id && <Check className="w-4 h-4 ml-auto text-electric-500" />}
                        </button>
                      ))}
                      <div className={cn("border-t my-1", darkMode ? "border-ocean-700" : "border-slate-100")} />
                      <button
                        className={cn(
                          "flex items-center w-full px-2 py-2 rounded-md font-medium text-sm",
                          darkMode ? "text-electric-400 hover:bg-ocean-800" : "text-electric-600 hover:bg-electric-50"
                        )}
                        onClick={() => setShowCreateModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create new profile
                      </button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Center: nav actions (desktop) */}
                <nav className="hidden md:flex items-center gap-1">
                  {[
                    { icon: <BarChart3 className="w-4 h-4" />, label: "Analytics", onClick: () => setShowAnalytics(true) },
                    { icon: <Share2 className="w-4 h-4" />, label: "Share", onClick: () => setShowShare(true) },
                    { icon: <Settings className="w-4 h-4" />, label: "Settings", onClick: () => setShowSettings(true) },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        darkMode ? "text-ocean-300 hover:text-white hover:bg-ocean-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                      aria-label={item.label}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Right: sync + auth */}
                {authControls}
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 pb-28 md:pb-12">
              {/* Page heading */}
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <h1 className={cn("text-2xl lg:text-3xl font-display font-bold tracking-tight", darkMode ? "text-white" : "text-slate-900")}>
                    {getDayOfWeek(getTodayDate())}
                  </h1>
                  <p className={cn("text-sm mt-1 tabular-nums", darkMode ? "text-ocean-400" : "text-slate-500")}>
                    {getTodayDate()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg border",
                    darkMode ? "bg-ocean-900 border-ocean-800" : "bg-white border-slate-200"
                  )}>
                    <Flame className="w-4 h-4 text-coral-500" />
                    <span className={cn("text-sm font-semibold tabular-nums", darkMode ? "text-white" : "text-slate-900")}>
                      {getCurrentStreak(currentProfile)}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-ocean-400" : "text-slate-500")}>day streak</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg border",
                    darkMode ? "bg-ocean-900 border-ocean-800" : "bg-white border-slate-200"
                  )}>
                    <TrendingUp className="w-4 h-4 text-electric-500" />
                    <span className={cn("text-sm font-semibold tabular-nums", darkMode ? "text-white" : "text-slate-900")}>
                      {getCompletionRate(currentProfile)}%
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-ocean-400" : "text-slate-500")}>today</span>
                  </div>
                  <Button
                    onClick={handleAddActivity}
                    className="hidden md:inline-flex bg-electric-600 hover:bg-electric-700 text-white rounded-lg font-medium gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add activity
                  </Button>
                </div>
              </div>

              {/* Desktop grid: activities left, insights right */}
              <div className="grid lg:grid-cols-5 gap-8 items-start">
                {/* Activities column */}
                <section className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn("text-lg font-display font-semibold tracking-tight", darkMode ? "text-white" : "text-slate-900")}>
                      Today&apos;s activities
                    </h2>
                    <span className={cn("text-xs", darkMode ? "text-ocean-400" : "text-slate-500")}>
                      {getActivitiesForToday(currentProfile).length} planned
                    </span>
                  </div>
                  <DragDropContext onDragEnd={handleReorderActivities}>
                    <Droppable droppableId="activities">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          <AnimatePresence>
                            {getActivitiesForToday(currentProfile).map((activity: Activity, idx: number) => {
                              // Determine state from dailyRecords
                              const today = getTodayDate();
                              const daily = currentProfile.dailyRecords?.[today];
                              const actState = daily?.activities?.[activity.id]?.completed
                                ? "completed"
                                : "planned";
                              return (
                                <Draggable key={activity.id} draggableId={activity.id} index={idx}>
                                  {(draggableProvided) => (
                                    <div
                                      ref={draggableProvided.innerRef}
                                      {...draggableProvided.draggableProps}
                                      style={draggableProvided.draggableProps.style}
                                    >
                                      <ActivityCard
                                        activity={activity}
                                        state={actState}
                                        onCheck={() => handleToggleActivity(activity.id)}
                                        onEdit={() => handleEditActivity(activity)}
                                        onDelete={() => setDeleteConfirmId(activity.id)}
                                        dragHandleProps={draggableProvided.dragHandleProps}
                                        darkMode={darkMode}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {getActivitiesForToday(currentProfile).length === 0 && (
                              <motion.div
                                className={cn(
                                  "w-full flex flex-col items-center justify-center py-14 rounded-xl border border-dashed",
                                  darkMode ? "border-ocean-700 text-ocean-400" : "border-slate-300 text-slate-500"
                                )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <span className="text-sm mb-3">No activities planned for today.</span>
                                <Button
                                  onClick={handleAddActivity}
                                  variant="outline"
                                  className={cn("rounded-lg gap-1.5", darkMode && "border-ocean-700 text-white hover:bg-ocean-800")}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add your first activity
                                </Button>
                              </motion.div>
                            )}
                            {provided.placeholder}
                          </AnimatePresence>
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </section>

                {/* Insights column */}
                <aside className="lg:col-span-2 space-y-6">
                  {/* Progress ring card */}
                  <div className={cn(
                    "rounded-xl border p-6 flex flex-col items-center",
                    darkMode ? "bg-ocean-900 border-ocean-800" : "bg-white border-slate-200 shadow-sm"
                  )}>
                    <ProgressRing
                      size={170}
                      animate
                      ariaLabel="Today's Progress"
                      layers={[
                        {
                          value: Math.max(0, Math.min(getCompletionRate(currentProfile) / 100, 1)),
                          color:
                            getCompletionRate(currentProfile) < 30
                              ? COLOR_PALETTE.warning
                              : getCompletionRate(currentProfile) < 70
                              ? COLOR_PALETTE.accent
                              : COLOR_PALETTE.success,
                          strokeWidth: 14,
                          pulse: getCompletionRate(currentProfile) === 100,
                          zIndex: 2,
                        },
                        {
                          value: 1,
                          color: COLOR_PALETTE[currentProfile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary,
                          strokeWidth: 3,
                          dashed: true,
                          zIndex: 1,
                        },
                        ...(getCompletionRate(currentProfile) === 100
                          ? [
                              {
                                value: 1,
                                color: "#D97706",
                                strokeWidth: 3,
                                pulse: true,
                                zIndex: 3,
                              },
                            ]
                          : []),
                      ]}
                    >
                      <span className={cn("text-4xl font-display font-bold tabular-nums", darkMode ? "text-white" : "text-slate-900")}>
                        {getCompletionRate(currentProfile)}%
                      </span>
                      <span className="text-xs font-medium flex items-center gap-1 mt-1.5 text-coral-500" aria-label="Current streak">
                        <Flame className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{getCurrentStreak(currentProfile)}</span> days
                      </span>
                      <span className={cn("text-xs mt-1", darkMode ? "text-ocean-400" : "text-slate-500")}>
                        {getCompletionRate(currentProfile) < 30
                          ? "Let's get started"
                          : getCompletionRate(currentProfile) < 70
                          ? "Keep going"
                          : "Excellent focus"}
                      </span>
                    </ProgressRing>
                  </div>

                  {/* Weekly Overview */}
                  <div className="w-full">
                    <WeeklyOverview dailyRecords={currentProfile.dailyRecords || {}} darkMode={darkMode} />
                  </div>

                  {/* Monthly Heatmap */}
                  <div className="w-full">
                    <MonthlyHeatmap
                      dailyRecords={
                        (Object.values(currentProfile.dailyRecords || {}) as DailyRecord[])
                          .filter((rec: DailyRecord) => {
                            if (!rec?.date) return false;
                            const date = new Date(rec.date);
                            const now = new Date();
                            return (
                              date.getUTCFullYear() === now.getUTCFullYear() &&
                              date.getUTCMonth() === now.getUTCMonth()
                            );
                          })
                          .map((rec: DailyRecord) => ({
                            date: rec.date,
                            completion: rec.completionRate ?? 0,
                            mood: rec.mood,
                          })) as import("@/components/ui/MonthlyHeatmap").DailyRecord[]
                      }
                      month={new Date().getUTCMonth()}
                      year={new Date().getUTCFullYear()}
                      darkMode={darkMode}
                    />
                  </div>
                </aside>
              </div>
            </main>

            {/* Mobile bottom nav */}
            <nav className={cn(
              "md:hidden fixed bottom-0 left-0 w-full border-t flex flex-row items-center justify-around py-2 z-30 backdrop-blur",
              darkMode ? "bg-ocean-950/95 border-ocean-800" : "bg-white/95 border-slate-200"
            )}>
              {[
                { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics", onClick: () => setShowAnalytics(true) },
                { icon: <Plus className="w-5 h-5" />, label: "Add", onClick: handleAddActivity, primary: true },
                { icon: <Share2 className="w-5 h-5" />, label: "Share", onClick: () => setShowShare(true) },
                { icon: <Settings className="w-5 h-5" />, label: "Settings", onClick: () => setShowSettings(true) },
              ].map((item: any) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-col items-center px-4 py-1.5 rounded-lg text-xs font-medium gap-1",
                    item.primary
                      ? "text-electric-600"
                      : darkMode ? "text-ocean-300" : "text-slate-500"
                  )}
                  aria-label={item.label}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Analytics Modal */}
            <AnalyticsModal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} profile={currentProfile} />

            {/* Settings Modal */}
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              profile={currentProfile}
              onUpdateProfile={handleUpdateProfile}
            />

            {/* Share Achievement Modal */}
            {showShare && (
              <ShareAchievement profile={currentProfile} onClose={() => setShowShare(false)} />
            )}
          </div>
        )}

        {/* Create Profile Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent
            ref={modalRef}
            className="max-w-lg w-full rounded-xl p-0 overflow-hidden bg-white border border-slate-200 shadow-xl"
            aria-modal="true"
            aria-labelledby="create-profile-title"
            aria-describedby="create-profile-desc"
          >
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <DialogTitle id="create-profile-title" className="text-lg font-display font-semibold text-slate-900">
                Create new profile
              </DialogTitle>
              <DialogDescription id="create-profile-desc" className="text-slate-500 text-sm">
                Personalize your FocusFlow experience
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleCreateProfile();
              }}
              className="px-6 pb-6 pt-5"
              autoComplete="off"
            >
              {/* Name */}
              <div className="mb-5">
                <Label htmlFor="profile-name" className="block mb-1.5 text-sm font-medium text-slate-900">
                  Profile name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="profile-name"
                  name="profile-name"
                  maxLength={20}
                  required
                  autoFocus
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value.slice(0, 20) }))}
                  placeholder="e.g. Deep Work Mode"
                  className="w-full rounded-lg border-slate-300 focus-visible:ring-electric-500"
                  aria-required="true"
                  aria-label="Profile name"
                />
                <span className="text-xs text-slate-400 mt-1 block tabular-nums">{createForm.name.length}/20</span>
              </div>

              {/* Avatar Picker */}
              <div className="mb-5">
                <Label className="block mb-1.5 text-sm font-medium text-slate-900">Avatar</Label>
                <div className="flex flex-row items-center gap-3">
                  <div className="w-12 h-12 text-2xl bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                    {createForm.avatar}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-sm rounded-lg border-slate-300 text-slate-700"
                        aria-label="Pick emoji"
                      >
                        Choose emoji
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 overflow-y-auto p-3 rounded-lg">
                      <ScrollArea className="h-48 w-64">
                        {EMOJI_CATEGORIES.map(cat => (
                          <div key={cat.name} className="mb-3">
                            <div className="text-xs text-slate-400 mb-1.5 uppercase tracking-wide">{cat.name}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="w-9 h-9 text-xl rounded-lg flex items-center justify-center hover:bg-electric-50 focus:bg-electric-100 focus:outline-none transition-colors"
                                  onClick={() => setCreateForm(f => ({ ...f, avatar: emoji }))}
                                  aria-label={`Pick emoji ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Type Picker */}
              <div className="mb-5">
                <Label className="block mb-2 text-sm font-medium text-slate-900">Profile type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILE_TYPES.map(type => (
                    <button
                      key={type.key}
                      type="button"
                      className={cn(
                        "relative flex flex-col items-start px-3.5 py-3 rounded-lg border text-left transition-colors",
                        createForm.type === type.key
                          ? "border-electric-500 bg-electric-50 ring-1 ring-electric-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                      onClick={() => setCreateForm(f => ({ ...f, type: type.key as ProfileType }))}
                      aria-label={`Select ${type.label} profile`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-lg">{type.emoji}</span>
                        <span className="font-medium text-slate-900 text-sm">{type.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">{type.desc}</span>
                      {createForm.type === type.key && (
                        <Check className="absolute top-2.5 right-2.5 w-4 h-4 text-electric-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-electric-600 hover:bg-electric-700 text-white rounded-lg px-6 font-medium"
                  disabled={!createForm.name.trim() || createForm.name.length > 20}
                  aria-disabled={!createForm.name.trim() || createForm.name.length > 20}
                >
                  Create profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Activity Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-lg w-full rounded-xl p-0 overflow-hidden bg-white border border-slate-200 shadow-xl">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <DialogTitle className="text-lg font-display font-semibold text-slate-900">
                {activityEditId ? "Edit activity" : "Add activity"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                {activityEditId
                  ? "Update your activity details"
                  : "Add a new activity to your day"}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSaveActivity}
              className="px-6 py-5 space-y-5"
              autoComplete="off"
            >
              {/* Name */}
              <div>
                <Label htmlFor="activity-name" className="block mb-1.5 text-sm font-medium text-slate-900">
                  Activity name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activity-name"
                  name="activity-name"
                  maxLength={50}
                  required
                  value={activityForm?.name || ""}
                  onChange={e => setActivityForm((f: any) => ({ ...f, name: e.target.value.slice(0, 50) }))}
                  placeholder="e.g. Yoga, Deep Work, Family Time"
                  className="w-full rounded-lg border-slate-300 focus-visible:ring-electric-500"
                  aria-required="true"
                  aria-label="Activity name"
                />
                <span className="text-xs text-slate-400 mt-1 block tabular-nums">{activityForm?.name?.length || 0}/50</span>
              </div>
              {/* Duration and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity-duration" className="block mb-1.5 text-sm font-medium text-slate-900">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="activity-duration"
                    name="activity-duration"
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    required
                    value={activityForm?.duration || 15}
                    onChange={e => setActivityForm((f: any) => ({ ...f, duration: Math.max(15, Math.min(480, Number(e.target.value))) }))}
                    className="w-full rounded-lg border-slate-300 focus-visible:ring-electric-500 tabular-nums"
                    aria-required="true"
                    aria-label="Activity duration"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">15 min to 8 hours</span>
                </div>
                <div>
                  <Label htmlFor="activity-time" className="block mb-1.5 text-sm font-medium text-slate-900">
                    Start time
                  </Label>
                  <TimePickerInput
                    id="activity-time"
                    name="activity-time"
                    value={activityForm?.startTime}
                    onChange={(time) => setActivityForm((f: any) => ({ ...f, startTime: time }))}
                    className="w-full rounded-lg border-slate-300 focus-visible:ring-electric-500"
                    aria-label="Activity start time"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Optional</span>
                </div>
              </div>
              {/* Category */}
              <div>
                <Label htmlFor="activity-category" className="block mb-1.5 text-sm font-medium text-slate-900">
                  Category
                </Label>
                <select
                  id="activity-category"
                  name="activity-category"
                  required
                  value={activityForm?.category || ""}
                  onChange={e => setActivityForm((f: any) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
                  aria-required="true"
                  aria-label="Activity category"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {ACTIVITY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {/* Color Picker */}
              <div>
                <Label className="block mb-2 text-sm font-medium text-slate-900">Color</Label>
                <div className="flex flex-row items-center gap-2.5 flex-wrap">
                  {ACTIVITY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
                        activityForm?.color === color
                          ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                          : "hover:scale-105"
                      )}
                      style={{ background: color }}
                      onClick={() => setActivityForm((f: any) => ({ ...f, color }))}
                      aria-label={`Pick color ${color}`}
                    >
                      {activityForm?.color === color && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Emoji Picker */}
              <div>
                <Label className="block mb-2 text-sm font-medium text-slate-900">Icon</Label>
                <div className="flex flex-row items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl">
                    {activityForm?.icon}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg border-slate-300 text-slate-700 text-sm"
                        aria-label="Pick emoji"
                      >
                        Choose emoji
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-72 overflow-y-auto p-3 rounded-lg">
                      <ScrollArea className="h-56 w-72">
                        {EMOJI_CATEGORIES.map(cat => (
                          <div key={cat.name} className="mb-3">
                            <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">{cat.name}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-colors hover:bg-electric-50 focus:bg-electric-100 focus:outline-none"
                                  onClick={() => setActivityForm((f: any) => ({ ...f, icon: emoji }))}
                                  aria-label={`Pick emoji ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <DialogFooter className="flex flex-row justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowActivityModal(false)}
                  className="rounded-lg px-4 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-electric-600 hover:bg-electric-700 text-white rounded-lg px-6 font-medium disabled:opacity-50"
                  disabled={!activityForm?.name?.trim() || activityForm?.name?.length > 50}
                  aria-disabled={!activityForm?.name?.trim() || activityForm?.name?.length > 50}
                >
                  {activityEditId ? "Save changes" : "Add activity"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Activity Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm w-full rounded-xl p-0 overflow-hidden bg-white border border-slate-200 shadow-xl">
            <DialogHeader className="px-6 pt-6 pb-3">
              <DialogTitle className="text-lg font-display font-semibold text-slate-900">
                Delete activity
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Are you sure you want to delete this activity? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 pt-2 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5"
                onClick={() => handleDeleteActivity(deleteConfirmId!)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
