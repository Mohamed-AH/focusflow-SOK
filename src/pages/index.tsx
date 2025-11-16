import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";

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
  };
}

import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

// --- Constants & Templates ---

const COLOR_PALETTE = {
  primary: "#3B82F6",
  secondary: "#10B981",
  accent: "#F59E0B",
  success: "#059669",
  warning: "#DC2626",
  background: "#F8FAFC",
  dark: "#0F172A",
  student: "#8B5CF6",
  professional: "#3B82F6",
  entrepreneur: "#F59E0B",
  creative: "#EC4899",
  mom: "#10B981",
  blue: "#3B82F6",
  green: "#10B981",
  amber: "#F59E0B",
  emerald: "#059669",
  red: "#DC2626",
  pink: "#EC4899",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  orange: "#F97316",
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

// Emoji picker (simple, can be expanded)
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
    "study-sessions": { name: "Study Sessions", duration: 120, color: "#8B5CF6", icon: "📚", category: "academic" },
    "attend-classes": { name: "Attend Classes", duration: 60, color: "#3B82F6", icon: "🎓", category: "academic" },
    "assignments": { name: "Complete Assignments", duration: 90, color: "#10B981", icon: "✍️", category: "academic" },
    "exercise": { name: "Exercise/Break", duration: 60, color: "#F59E0B", icon: "🏃‍♂️", category: "wellness" },
    "personal-time": { name: "Personal Time", duration: 60, color: "#EC4899", icon: "🎮", category: "personal" },
    "social-meals": { name: "Social/Meals", duration: 60, color: "#F97316", icon: "🍕", category: "social" }
  },
  professional: {
    "deep-work": { name: "Deep Work", duration: 120, color: "#3B82F6", icon: "💻", category: "work" },
    "meetings": { name: "Meetings", duration: 60, color: "#10B981", icon: "👥", category: "work" },
    "email-admin": { name: "Email/Admin", duration: 30, color: "#F59E0B", icon: "📧", category: "work" },
    "learning": { name: "Learning/Development", duration: 60, color: "#8B5CF6", icon: "📚", category: "development" },
    "lunch": { name: "Lunch Break", duration: 60, color: "#EC4899", icon: "🍽️", category: "break" },
    "personal-tasks": { name: "Personal Tasks", duration: 30, color: "#F97316", icon: "📝", category: "personal" }
  },
  entrepreneur: {
    "business-dev": { name: "Business Development", duration: 120, color: "#F59E0B", icon: "📈", category: "business" },
    "product-work": { name: "Product Work", duration: 120, color: "#3B82F6", icon: "🛠️", category: "product" },
    "marketing": { name: "Marketing/Content", duration: 60, color: "#EC4899", icon: "📱", category: "marketing" },
    "networking": { name: "Networking", duration: 60, color: "#10B981", icon: "🤝", category: "networking" },
    "planning": { name: "Planning/Strategy", duration: 60, color: "#8B5CF6", icon: "🗺️", category: "strategy" },
    "self-care": { name: "Self-Care", duration: 60, color: "#F97316", icon: "🧘‍♂️", category: "wellness" }
  },
  creative: {
    "creative-work": { name: "Creative Work", duration: 180, color: "#EC4899", icon: "🎨", category: "creative" },
    "research": { name: "Research/Inspiration", duration: 60, color: "#8B5CF6", icon: "🔍", category: "research" },
    "admin-tasks": { name: "Admin/Business Tasks", duration: 60, color: "#3B82F6", icon: "📊", category: "business" },
    "skill-dev": { name: "Skill Development", duration: 60, color: "#10B981", icon: "🎯", category: "learning" },
    "breaks": { name: "Breaks/Recharge", duration: 60, color: "#F59E0B", icon: "☕", category: "break" },
    "life-maintenance": { name: "Life Maintenance", duration: 60, color: "#F97316", icon: "🏠", category: "personal" }
  },
  mom: {
    "morning-routine": { name: "Morning Routine", duration: 45, color: "#F59E0B", icon: "☀️", category: "personal" },
    "kids-prep": { name: "Kids Prep & School", duration: 60, color: "#3B82F6", icon: "🎒", category: "family" },
    "meal-prep": { name: "Meal Prep & Cooking", duration: 90, color: "#10B981", icon: "🍳", category: "household" },
    "self-care": { name: "Self-Care Time", duration: 45, color: "#EC4899", icon: "💆‍♀️", category: "personal" },
    "learning": { name: "Learning/Personal Growth", duration: 60, color: "#8B5CF6", icon: "📚", category: "development" },
    "family-calls": { name: "Family Calls/Relatives", duration: 30, color: "#F97316", icon: "📞", category: "social" },
    "household": { name: "Household Management", duration: 60, color: "#06B6D4", icon: "🏠", category: "household" },
    "family-time": { name: "Evening Family Time", duration: 90, color: "#EF4444", icon: "👨‍👩‍👧‍👦", category: "family" }
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
}: {
  activity: any;
  state?: "planned" | "inprogress" | "completed";
  onCheck?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: any;
}) => {
  const accent = activity.color || COLOR_PALETTE.primary;

  // Glassmorphism styling based on state
  const cardStyles = {
    planned: {
      bg: "bg-white/70 backdrop-blur-xl",
      border: "border-slate-200/50",
      shadow: "shadow-sm hover:shadow-md",
      text: "text-slate-800",
    },
    inprogress: {
      bg: "bg-electric-50/80 backdrop-blur-xl",
      border: "border-electric-400/60",
      shadow: "shadow-lg shadow-electric-500/20",
      text: "text-slate-900",
    },
    completed: {
      bg: "bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-xl",
      border: "border-green-400/50",
      shadow: "shadow-md shadow-green-500/10",
      text: "text-green-800",
    },
  };

  const currentStyle = cardStyles[state];

  return (
    <motion.div
      className={cn(
        "flex flex-row items-center w-full rounded-2xl border px-4 py-4 mb-3 transition-all duration-300 group relative overflow-hidden",
        currentStyle.bg,
        currentStyle.border,
        currentStyle.shadow,
        "hover:-translate-y-0.5"
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      layout
      tabIndex={0}
      aria-label={`Activity: ${activity.name}`}
      onDoubleClick={onEdit}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onContextMenu={e => {
        e.preventDefault();
        if (onEdit) onEdit();
      }}
    >
      {/* Gradient accent bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{
          background: `linear-gradient(to bottom, ${accent}, ${accent}aa)`,
          boxShadow: state === "inprogress" ? `0 0 12px ${accent}60` : "none",
        }}
        aria-hidden="true"
      />

      {/* Left: Checkbox */}
      <button
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-full border-2 ml-2 mr-4 transition-all duration-300",
          state === "completed"
            ? "border-green-500 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30"
            : "border-slate-300 bg-white/80 text-slate-400 hover:border-electric-500 hover:bg-electric-50 focus:ring-2 focus:ring-electric-400"
        )}
        aria-label={state === "completed" ? "Mark as incomplete" : "Mark as complete"}
        onClick={onCheck}
        tabIndex={0}
      >
        {state === "completed" ? (
          <motion.span
            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="text-lg font-bold"
          >
            ✓
          </motion.span>
        ) : (
          <span className="text-lg"> </span>
        )}
      </button>

      {/* Center: Name, duration, category */}
      <div className="flex-1 flex flex-col min-w-0" onClick={onEdit} style={{ cursor: "pointer" }}>
        <span className={cn("text-lg font-sans font-semibold truncate", currentStyle.text)}>
          {activity.name}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-display text-sm text-electric-600 font-semibold">
            {activity.duration}
          </span>
          <span className="font-sans text-xs text-slate-500">min</span>
          <span className="text-slate-300">•</span>
          <span className="font-sans text-xs text-slate-600 bg-white/60 px-2 py-0.5 rounded-full">
            {activity.category}
          </span>
          {activity.startTime && (
            <>
              <span className="text-slate-300">•</span>
              <span className="font-sans text-xs text-slate-600">
                {formatTime(activity.startTime)}
              </span>
            </>
          )}
        </div>
        {/* Progress bar */}
        {state !== "planned" && (
          <div className="w-full h-1 bg-slate-200/50 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-1 rounded-full"
              style={{
                background: state === "completed"
                  ? "linear-gradient(to right, #22c55e, #10b981)"
                  : `linear-gradient(to right, ${accent}, ${accent}cc)`,
              }}
              initial={{ width: 0 }}
              animate={{
                width: state === "completed" ? "100%" : state === "inprogress" ? "50%" : "0%",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      {/* Right: Emoji, actions */}
      <div className="flex flex-row items-center ml-4 gap-2">
        <span className="text-3xl" aria-label="Activity icon">{activity.icon}</span>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="text-base text-coral-500 hover:scale-110 transition-transform"
            aria-label="Delete activity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            tabIndex={0}
          >
            🗑️
          </button>
          <button
            {...dragHandleProps}
            className="text-base text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing hover:scale-110 transition-all"
            aria-label="Reorder activity"
            tabIndex={0}
          >
            ☰
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Analytics Modal Component ---
const AnalyticsModal = ({ isOpen, onClose, profile }: { isOpen: boolean; onClose: () => void; profile: Profile | null }) => {
  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] w-full h-[95vh] sm:h-[90vh] p-0 overflow-hidden gap-0">
        <DashboardLayout profile={profile} onClose={onClose} />
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

  const handleSave = () => {
    onUpdateProfile({
      preferences: {
        ...profile.preferences,
        completionGoal: completionGoal,
      },
    });
    toast({
      title: "Settings Saved!",
      description: `Completion goal set to ${completionGoal}%`
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your FocusFlow experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <span className="text-3xl">{profile.avatar}</span>
            <div>
              <div className="font-semibold">{profile.name}</div>
              <div className="text-sm text-muted-foreground capitalize">{profile.type} Profile</div>
            </div>
          </div>

          {/* Completion Goal Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="completion-goal" className="text-sm font-medium">
                Daily Completion Goal
              </Label>
              <span className="text-2xl font-bold text-primary">{completionGoal}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete at least this percentage of activities to maintain your streak
            </p>
            <input
              id="completion-goal"
              type="range"
              min="50"
              max="100"
              step="5"
              value={completionGoal}
              onChange={(e) => setCompletionGoal(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Theme Section (Placeholder for future) */}
          <div className="space-y-2 opacity-50">
            <Label className="text-sm font-medium">Theme</Label>
            <p className="text-xs text-muted-foreground">
              🌙 Dark mode coming soon!
            </p>
          </div>

          {/* Profile Stats */}
          <div className="pt-4 border-t space-y-2">
            <div className="text-sm font-medium mb-2">Profile Statistics</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-muted-foreground text-xs">Current Streak</div>
                <div className="font-semibold">{profile.streaks.current} days</div>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-muted-foreground text-xs">Best Streak</div>
                <div className="font-semibold">{profile.streaks.best} days</div>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-muted-foreground text-xs">Perfect Days</div>
                <div className="font-semibold">{profile.streaks.perfectDays}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-muted-foreground text-xs">Total Activities</div>
                <div className="font-semibold">{Object.keys(profile.activities).length}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
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
    return `FocusFlow Progress Update\n\n📅 ${today}\n🎯 ${completionRate}% Complete\n🔥 ${streak} Day Streak\n`;
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          text: text
        });
      } catch (err) {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!", description: "Share your progress with others!" });
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!", description: "Share your progress with others!" });
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Progress</DialogTitle>
          <DialogDescription>
            Share your daily achievements with others!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          <pre className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
            {generateShareText()}
          </pre>
          <Button onClick={handleShare} className="w-full">
            Share Progress
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

  // Activity modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState<any>(null); // null = add, object = edit
  const [activityEditId, setActivityEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Debounce save
  const saveTimeout = useRef<any>(null);

  // Load from localStorage
  useEffect(() => {
    setLoading(true);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      let data = raw ? JSON.parse(raw) : null;
      if (!validateAppData(data)) {
        data = getInitialData();
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

  // --- Activity Completion (for demo, toggles completed state in dailyRecords) ---
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
          title: "Almost there! 📊", 
          description: `You're at ${daily.completionRate}%. Just a bit more to reach ${completionGoal}% and maintain your streak!`, 
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
            title: "Streak increased! 🔥", 
            description: `You've maintained a ${streaks.current} day streak!`, 
            variant: "default" 
          });
        }
      } else {
        if (streaks.lastUpdate !== today) {
          streaks.current = 0;
          streaks.lastUpdate = today;
          toast({ 
            title: "Streak at risk! ⚠️", 
            description: "Keep your daily completion above 70% to maintain your streak!", 
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

  // --- Accessibility: Focus trap for modal ---
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showCreateModal && modalRef.current) {
      const firstInput = modalRef.current.querySelector("input");
      if (firstInput) (firstInput as HTMLInputElement).focus();
    }
  }, [showCreateModal]);

  // --- Main Render ---
  return (
    <>
      <Head>
        <title>FocusFlow - Beat the Scroll</title>
        <meta name="description" content="Beat the Scroll, Build Focus. A playful, minimalist productivity app for every life." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={cn(
          "min-h-screen flex flex-col items-center justify-start bg-background",
          "font-sans",
          "transition-colors duration-300"
        )}
        style={{
          background: `linear-gradient(120deg, #F8FAFC 60%, #E0F2FE 100%)`,
        }}
      >
        {/* If no profile selected, show onboarding */}
        {!currentProfile ? (
          <>
            {/* New Landing Page */}
            <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 font-sans overflow-x-hidden">
              {/* Hero Section */}
              <section className="relative w-full min-h-[85vh] md:min-h-screen flex items-center justify-center px-4 py-12 md:py-20 overflow-hidden">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 bg-mesh-gradient opacity-60" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80" aria-hidden="true" />

                {/* Floating orbs for depth */}
                <motion.div
                  className="absolute top-1/4 left-[10%] w-64 h-64 bg-electric-400/20 rounded-full blur-3xl"
                  animate={{
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  aria-hidden="true"
                />
                <motion.div
                  className="absolute bottom-1/4 right-[15%] w-72 h-72 bg-coral-400/20 rounded-full blur-3xl"
                  animate={{
                    y: [0, -40, 0],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 w-full max-w-6xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left: Hero Content */}
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <motion.div
                        className="inline-block"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                      >
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-electric-200/50 text-sm font-medium text-ocean-900">
                          <span className="w-2 h-2 bg-electric-400 rounded-full mr-2 animate-pulse" />
                          Built for focus, designed for life
                        </span>
                      </motion.div>

                      <motion.h1
                        className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-slate-900 leading-[1.1]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                      >
                        Track habits.{" "}
                        <span className="bg-gradient-to-r from-electric-500 to-coral-400 bg-clip-text text-transparent">
                          Build streaks.
                        </span>{" "}
                        Stay focused.
                      </motion.h1>

                      <motion.p
                        className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                      >
                        A minimal habit tracker with visual progress rings, streak tracking, and analytics—designed for your actual life.
                      </motion.p>

                      {/* Feature Pills */}
                      <motion.div
                        className="flex flex-wrap gap-3 pt-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                      >
                        {[
                          { icon: "✓", text: "No account required" },
                          { icon: "✓", text: "Works offline" },
                          { icon: "✓", text: "Multiple profiles" },
                          { icon: "✓", text: "Visual analytics" },
                        ].map((pill, i) => (
                          <motion.span
                            key={i}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200/50 text-sm text-slate-700"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                          >
                            <span className="text-electric-500 mr-1.5 font-bold">{pill.icon}</span>
                            {pill.text}
                          </motion.span>
                        ))}
                      </motion.div>

                      <motion.div
                        className="pt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                      >
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          className="group relative px-8 py-6 bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-electric-500/30 hover:shadow-xl hover:shadow-electric-500/40 transition-all duration-300 border-0"
                          aria-label="Start tracking your habits"
                        >
                          <span className="relative z-10">Start Tracking</span>
                          <motion.span
                            className="absolute inset-0 bg-white/20 rounded-2xl"
                            initial={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                      </motion.div>
                    </motion.div>

                    {/* Right: Visual Element - Abstract Representation */}
                    <motion.div
                      className="hidden md:block relative"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    >
                      <div className="relative aspect-square max-w-md mx-auto">
                        {/* Progress ring visualization */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-electric-100 to-coral-100 blur-2xl opacity-60"
                          animate={{
                            scale: [1, 1.05, 1],
                            rotate: [0, 5, 0],
                          }}
                          transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
                          <div className="aspect-square flex items-center justify-center">
                            {/* Simulated progress ring */}
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                              <circle
                                cx="100"
                                cy="100"
                                r="85"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                              />
                              <motion.circle
                                cx="100"
                                cy="100"
                                r="85"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray="534"
                                initial={{ strokeDashoffset: 534 }}
                                animate={{ strokeDashoffset: 534 * 0.25 }}
                                transition={{ duration: 2, ease: "easeOut", delay: 1 }}
                              />
                              <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#ff6b6b" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <motion.div
                              className="absolute inset-0 flex flex-col items-center justify-center"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.5, duration: 0.6 }}
                            >
                              <span className="text-5xl font-display font-bold text-slate-900">75%</span>
                              <span className="text-sm text-slate-500 mt-1">Daily Progress</span>
                              <div className="flex items-center gap-2 mt-4">
                                <span className="text-2xl">🔥</span>
                                <span className="text-lg font-semibold text-amber-600">12 days</span>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Features Section - Bento Box Layout */}
              <section className="relative w-full px-4 py-16 md:py-24 bg-white">
                <div className="max-w-6xl mx-auto">
                  <motion.div
                    className="text-center mb-12 md:mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                  >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
                      What you actually get
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      No fluff, no fake promises. Here's what FocusFlow does, period.
                    </p>
                  </motion.div>

                  {/* Bento Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Feature 1: Progress Tracking */}
                    <motion.div
                      className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-electric-50 to-electric-100/50 p-8 md:p-10 border border-electric-200/50 hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-electric-500 flex items-center justify-center mb-4">
                          <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3">
                          Daily progress at a glance
                        </h3>
                        <p className="text-slate-700 text-lg mb-4">
                          See your completion rate in real-time with a visual progress ring. No mental math required.
                        </p>
                        <ul className="space-y-2 text-slate-600">
                          <li className="flex items-start gap-2">
                            <span className="text-electric-500 mt-1">→</span>
                            <span>Check off activities as you complete them</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-electric-500 mt-1">→</span>
                            <span>Watch your progress ring fill throughout the day</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-electric-500 mt-1">→</span>
                            <span>Weekly and monthly views show completion patterns</span>
                          </li>
                        </ul>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-electric-200/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" aria-hidden="true" />
                    </motion.div>

                    {/* Feature 2: Streaks */}
                    <motion.div
                      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral-50 to-amber-50 p-8 md:p-10 border border-coral-200/50 hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-coral-400 flex items-center justify-center mb-4">
                          <span className="text-2xl">🔥</span>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">
                          Streaks that motivate
                        </h3>
                        <p className="text-slate-700 mb-4">
                          Build momentum with a streak counter that tracks consistency.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-display font-bold text-coral-500">12</span>
                            <span className="text-slate-600">day streak</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-display font-bold text-amber-500">28</span>
                            <span className="text-slate-600">best ever</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-display font-bold text-green-500">15</span>
                            <span className="text-slate-600">perfect days</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-coral-200/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" aria-hidden="true" />
                    </motion.div>

                    {/* Feature 3: Multiple Profiles */}
                    <motion.div
                      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 md:p-10 border border-purple-200/50 hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center mb-4">
                          <span className="text-2xl">👤</span>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">
                          Switch between roles
                        </h3>
                        <p className="text-slate-700 mb-4">
                          Because you're not just one thing. Create profiles for different parts of your life.
                        </p>
                        <div className="space-y-2 text-sm">
                          {["👩‍🎓 Student", "💼 Professional", "🚀 Entrepreneur", "🎨 Creative", "👩‍👧‍👦 Parent"].map((role, i) => (
                            <motion.div
                              key={i}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm"
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                            >
                              <span>{role}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="absolute -left-6 -top-6 w-48 h-48 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" aria-hidden="true" />
                    </motion.div>

                    {/* Feature 4: Analytics */}
                    <motion.div
                      className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 md:p-10 border border-green-200/50 hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center mb-4">
                          <span className="text-2xl">📈</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3">
                          See patterns you didn't notice
                        </h3>
                        <p className="text-slate-700 text-lg mb-4">
                          Comprehensive analytics beyond basic tracking—activity leaderboards, category performance, time-of-day heatmaps, and trend analysis.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Total time", value: "48h" },
                            { label: "Avg completion", value: "82%" },
                            { label: "Active days", value: "23" },
                            { label: "Best activity", value: "Deep Work" },
                          ].map((stat, i) => (
                            <motion.div
                              key={i}
                              className="bg-white/60 backdrop-blur-sm rounded-xl p-3"
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.6 + i * 0.1 }}
                            >
                              <div className="text-xs text-slate-600 mb-1">{stat.label}</div>
                              <div className="text-lg font-display font-bold text-slate-900">{stat.value}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="absolute -right-8 -top-8 w-64 h-64 bg-green-200/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" aria-hidden="true" />
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="relative w-full px-4 py-20 md:py-28 bg-gradient-to-br from-slate-900 via-ocean-900 to-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-30" aria-hidden="true">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-coral-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                      Ready to build better habits?
                    </h2>
                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                      No signup. No payment. No BS. Just create a profile and start tracking.
                    </p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="group relative px-10 py-7 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xl rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 border-0"
                      aria-label="Create your first profile"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Create Your First Profile
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </span>
                    </Button>
                  </motion.div>

                  {/* Existing profiles section (when user has profiles) */}
                  {profiles.length > 0 && (
                    <motion.div
                      className="mt-16 pt-12 border-t border-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3 className="text-2xl font-display font-semibold text-white mb-6">Your Profiles</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        {profiles.map((profile: any, idx: number) => (
                          <motion.button
                            key={profile.id}
                            className="group flex items-center gap-4 p-4 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-200"
                            onClick={() => handleProfileSwitch(profile.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Avatar className="w-12 h-12 border-2 border-white/30">
                              <AvatarFallback
                                className={cn(
                                  "flex h-full w-full items-center justify-center rounded-full text-2xl",
                                  {
                                    "bg-[#8B5CF6] text-white": profile.type === "student",
                                    "bg-[#3B82F6] text-white": profile.type === "professional" || profile.type === "custom",
                                    "bg-[#F59E0B] text-white": profile.type === "entrepreneur",
                                    "bg-[#EC4899] text-white": profile.type === "creative",
                                    "bg-[#10B981] text-white": profile.type === "mom",
                                  }
                                )}
                              >
                                {profile.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <div className="font-semibold text-white">{profile.name}</div>
                              <div className="text-sm text-slate-300 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  🔥 {getCurrentStreak(profile)}d
                                </span>
                                <span className="flex items-center gap-1">
                                  ✅ {getCompletionRate(profile)}%
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {loading && (
                    <div className="mt-8 text-white/60">Loading...</div>
                  )}

                  {storageError && (
                    <div className="mt-8 text-coral-400" role="alert">
                      {storageError}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          // --- Main Dashboard ---
          <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center px-4 pb-2 relative">
            {/* Background atmosphere */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 -z-10" aria-hidden="true" />
            <div className="fixed inset-0 bg-mesh-gradient opacity-20 -z-10" aria-hidden="true" />

            {/* Top Bar */}
            <div className="w-full flex flex-row items-center justify-between mt-4 mb-4">
              <div className="flex flex-row items-center">
                <Avatar className="w-12 h-12 mr-3 border-2 border-white shadow-md">
                  <AvatarFallback
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-full select-none",
                      "text-3xl leading-none",
                      {
                        "bg-[#8B5CF6] text-white": currentProfile.type === "student",
                        "bg-[#3B82F6] text-white": currentProfile.type === "professional" || currentProfile.type === "custom",
                        "bg-[#F59E0B] text-white": currentProfile.type === "entrepreneur",
                        "bg-[#EC4899] text-white": currentProfile.type === "creative",
                        "bg-[#10B981] text-white": currentProfile.type === "mom",
                      }
                    )}
                    style={{
                      boxShadow: `0 0 20px ${COLOR_PALETTE[currentProfile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary}40`
                    }}
                    aria-label="Profile avatar"
                  >
                    {currentProfile.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="font-sans font-semibold text-slate-900 text-base truncate max-w-[140px]">{currentProfile.name}</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="font-display text-sm font-semibold text-slate-800">{getTodayDate()}</span>
                <span className="font-sans text-xs text-slate-500 uppercase tracking-wide">{getDayOfWeek(getTodayDate())}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full px-3 py-2 text-base font-medium"
                    aria-label="Switch profile"
                  >
                    <span className="text-lg">⇄</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {profiles.map((profile: Profile) => (
                    <button
                      key={profile.id}
                      className={cn(
                        "flex flex-row items-center w-full px-2 py-2 rounded-lg",
                        currentProfileId === profile.id ? "bg-primary/10" : "hover:bg-slate-100"
                      )}
                      onClick={() => handleProfileSwitch(profile.id)}
                      aria-label={`Switch to profile ${profile.name}`}
                    >
                      <span className="mr-2 text-lg">{profile.avatar}</span>
                      <span className="text-sm">{profile.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    className="w-full text-left px-2 py-2 text-primary hover:bg-primary/10 rounded-lg"
                    onClick={() => setShowCreateModal(true)}
                  >
                    + Create New Profile
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Progress Ring */}
            <motion.div
              className="w-full flex flex-col items-center mt-4 mb-6 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Radial glow background */}
              <div className="absolute inset-0 flex items-center justify-center -z-10" aria-hidden="true">
                <div
                  className="w-64 h-64 rounded-full blur-3xl opacity-30"
                  style={{
                    background: `radial-gradient(circle, ${COLOR_PALETTE[currentProfile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary}40 0%, transparent 70%)`
                  }}
                />
              </div>

              {/* Glass card container */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
                <ProgressRing
                  size={180}
                  animate
                  ariaLabel="Today's Progress"
                  layers={[
                    {
                      // Main completion ring with gradient
                      value: Math.max(0, Math.min(getCompletionRate(currentProfile) / 100, 1)),
                      color:
                        getCompletionRate(currentProfile) < 30
                          ? COLOR_PALETTE.warning
                          : getCompletionRate(currentProfile) < 70
                          ? COLOR_PALETTE.accent
                          : COLOR_PALETTE.success,
                      strokeWidth: 16,
                      pulse: getCompletionRate(currentProfile) === 100,
                      zIndex: 2,
                    },
                    {
                      // Streak ring (thin, secondary color)
                      value: 1,
                      color: COLOR_PALETTE[currentProfile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary,
                      strokeWidth: 4,
                      dashed: true,
                      zIndex: 1,
                    },
                    ...(getCompletionRate(currentProfile) === 100
                      ? [
                          {
                            // Perfect day marker (outer ring, pulsing)
                            value: 1,
                            color: "#FFD700",
                            strokeWidth: 3,
                            pulse: true,
                            zIndex: 3,
                          },
                        ]
                      : []),
                  ]}
                >
                  <span className="text-5xl font-display font-bold text-slate-900">
                    {getCompletionRate(currentProfile)}%
                  </span>
                  <span className="text-sm font-sans text-coral-500 font-semibold flex items-center mt-2" aria-label="Current streak">
                    🔥 <span className="font-display ml-1 text-base">{getCurrentStreak(currentProfile)}</span>d
                  </span>
                  <span className="text-sm font-sans bg-gradient-to-r from-electric-600 to-coral-500 bg-clip-text text-transparent font-medium mt-2">
                    {getCompletionRate(currentProfile) < 30
                      ? "Let's get started!"
                      : getCompletionRate(currentProfile) < 70
                      ? "Keep going!"
                      : "Amazing focus!"}
                  </span>
                </ProgressRing>
              </div>
            </motion.div>
            {/* Weekly Overview */}
            <div className="w-full flex flex-col items-center mt-2 mb-4">
              <WeeklyOverview dailyRecords={currentProfile.dailyRecords || {}} />
            </div>
            {/* Monthly Heatmap */}
            <div className="w-full flex flex-col items-center mt-2 mb-4">
              <MonthlyHeatmap
                dailyRecords={
                  // Map dailyRecords to MonthlyHeatmap's expected shape for current month
                  (Object.values(currentProfile.dailyRecords || {}) as DailyRecord[])
                    .filter((rec: DailyRecord) => {
                      if (!rec?.date) return false;
                      const date = new Date(rec.date);
                      const now = new Date();
                      // Ensure we're comparing dates in UTC
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
              />
            </div>
            {/* Today's Focus Section */}
            <motion.div
              className="w-full flex flex-row items-center justify-between mt-6 mb-4 px-2 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex flex-col items-start">
                <span className="font-sans text-xs text-slate-500 uppercase tracking-wide">Date</span>
                <span className="font-display text-base font-bold text-slate-800">{getTodayDate()}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-sans text-xs text-coral-500 uppercase tracking-wide">🔥 Streak</span>
                <span className="font-display text-2xl font-bold text-coral-500">{getCurrentStreak(currentProfile)}<span className="text-sm">d</span></span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-sans text-xs text-electric-600 uppercase tracking-wide">Progress</span>
                <span className="font-display text-2xl font-bold text-electric-600">
                  {getCompletionRate(currentProfile)}<span className="text-sm">%</span>
                </span>
              </div>
            </motion.div>
            {/* Activity Cards with Drag and Drop */}
            <div className="w-full flex flex-col mt-4 mb-24 px-1 relative">
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-4 px-2">Today's Activities</h3>
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
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {getActivitiesForToday(currentProfile).length === 0 && (
                          <motion.div
                            className="w-full flex flex-col items-center justify-center py-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <span className="text-slate-400 text-lg">No activities planned for today.</span>
                          </motion.div>
                        )}
                        {provided.placeholder}
                      </AnimatePresence>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              {/* Add Activity Floating Button */}
              <Button
                className="fixed bottom-24 right-6 z-40 rounded-full w-16 h-16 bg-gradient-to-br from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white text-4xl flex items-center justify-center shadow-2xl transition-all duration-300 border-2 border-white/50 hover:scale-110 active:scale-95"
                style={{
                  boxShadow: "0 8px 24px rgba(6,182,212,0.35), 0 0 0 0 rgba(6,182,212,0.5)",
                }}
                aria-label="Add Activity"
                onClick={handleAddActivity}
              >
                +
              </Button>
            </div>
            {/* Bottom Navigation - Frosted Glass */}
            <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-white/50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex flex-row items-center justify-around py-3 z-30">
              <Button
                variant="ghost"
                className="flex flex-col items-center px-4 py-2 text-electric-600 hover:bg-electric-50/80 rounded-2xl transition-all duration-200 group"
                aria-label="Analytics"
                onClick={() => setShowAnalytics(true)}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                <span className="font-sans text-xs font-medium mt-1 uppercase tracking-wide">Analytics</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center px-4 py-2 text-coral-500 hover:bg-coral-50/80 rounded-2xl transition-all duration-200 group"
                aria-label="Share"
                onClick={() => setShowShare(true)}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">📤</span>
                <span className="font-sans text-xs font-medium mt-1 uppercase tracking-wide">Share</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center px-4 py-2 text-ocean-600 hover:bg-ocean-50/80 rounded-2xl transition-all duration-200 group"
                aria-label="Settings"
                onClick={() => setShowSettings(true)}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
                <span className="font-sans text-xs font-medium mt-1 uppercase tracking-wide">Settings</span>
              </Button>
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
          </main>
        )}

        {/* Create Profile Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent
            ref={modalRef}
            className="max-w-lg w-full rounded-2xl p-0 overflow-hidden"
            aria-modal="true"
            aria-labelledby="create-profile-title"
            aria-describedby="create-profile-desc"
          >
            <DialogHeader className="bg-primary/10 px-6 py-4">
              <DialogTitle id="create-profile-title" className="text-xl font-bold text-primary">
                Create New Profile
              </DialogTitle>
              <DialogDescription id="create-profile-desc" className="text-slate-600">
                Personalize your FocusFlow experience
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleCreateProfile();
              }}
              className="px-6 py-4"
              autoComplete="off"
            >
              {/* Name */}
              <div className="mb-4">
                <Label htmlFor="profile-name" className="block mb-1 font-medium text-slate-700">
                  Profile Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="profile-name"
                  name="profile-name"
                  maxLength={20}
                  required
                  autoFocus
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value.slice(0, 20) }))}
                  placeholder="e.g. Sarah's Mom Life"
                  className="w-full"
                  aria-required="true"
                  aria-label="Profile name"
                />
                <span className="text-xs text-slate-400 mt-1">{createForm.name.length}/20</span>
              </div>
              {/* Avatar Picker */}
              <div className="mb-4">
                <Label className="block mb-1 font-medium text-slate-700">Avatar Emoji</Label>
                <div className="flex flex-row items-center space-x-2">
                  <Button
                    type="button"
                    className="w-12 h-12 text-2xl bg-white border border-slate-200 rounded-full shadow-none"
                    aria-label="Current avatar"
                  >
                    {createForm.avatar}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        className="text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg shadow-none"
                        aria-label="Pick emoji"
                      >
                        Pick Emoji
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 overflow-y-auto p-2">
                      <ScrollArea className="h-48 w-64">
                        {EMOJI_CATEGORIES.map(cat => (
                          <div key={cat.name} className="mb-2">
                            <div className="text-xs text-slate-400 mb-1">{cat.name}</div>
                            <div className="flex flex-wrap gap-1">
                              {cat.emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className={cn(
                                    "w-8 h-8 text-lg rounded-full flex items-center justify-center hover:bg-primary/10 focus:bg-primary/20 focus:outline-none"
                                  )}
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
              <div className="mb-4">
                <Label className="block mb-1 font-medium text-slate-700">Profile Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILE_TYPES.map(type => (
                    <button
                      key={type.key}
                      type="button"
                      className={cn(
                        "flex flex-row items-center px-3 py-2 rounded-lg border transition-all duration-150",
                        createForm.type === type.key
                          ? "border-primary bg-primary/10"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      onClick={() => setCreateForm(f => ({ ...f, type: type.key as ProfileType }))}
                      aria-label={`Select ${type.label} profile`}
                    >
                      <span className="text-xl mr-2">{type.emoji}</span>
                      <span className="flex flex-col items-start">
                        <span className="text-sm font-semibold">{type.label}</span>
                        <span className="text-xs text-slate-500">{type.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter className="mt-6 flex flex-row justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white rounded-lg px-6"
                  disabled={!createForm.name.trim() || createForm.name.length > 20}
                  aria-disabled={!createForm.name.trim() || createForm.name.length > 20}
                >
                  Create Profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Activity Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-lg w-full rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-primary/10 px-6 py-4">
              <DialogTitle className="text-xl font-bold text-primary">
                {activityEditId ? "Edit Activity" : "Add Activity"}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {activityEditId
                  ? "Update your activity details"
                  : "Add a new custom activity to your day"}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSaveActivity}
              className="px-6 py-4"
              autoComplete="off"
            >
              {/* Name */}
              <div className="mb-4">
                <Label htmlFor="activity-name" className="block mb-1 font-medium text-slate-700">
                  Activity Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activity-name"
                  name="activity-name"
                  maxLength={50}
                  required
                  value={activityForm?.name || ""}
                  onChange={e => setActivityForm((f: any) => ({ ...f, name: e.target.value.slice(0, 50) }))}
                  placeholder="e.g. Yoga, Deep Work, Family Time"
                  className="w-full"
                  aria-required="true"
                  aria-label="Activity name"
                />
                <span className="text-xs text-slate-400 mt-1">{activityForm?.name?.length || 0}/50</span>
              </div>
              {/* Duration and Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="activity-duration" className="block mb-1 font-medium text-slate-700">
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
                    className="w-full"
                    aria-required="true"
                    aria-label="Activity duration"
                  />
                  <span className="text-xs text-slate-400 mt-1">15 min to 8 hours</span>
                </div>
                <div>
                  <Label htmlFor="activity-time" className="block mb-1 font-medium text-slate-700">
                    Start Time
                  </Label>
                  <TimePickerInput
                    id="activity-time"
                    name="activity-time"
                    value={activityForm?.startTime}
                    onChange={(time) => setActivityForm((f: any) => ({ ...f, startTime: time }))}
                    className="w-full"
                    aria-label="Activity start time"
                  />
                  <span className="text-xs text-slate-400 mt-1">Optional</span>
                </div>
              </div>
              {/* Category */}
              <div className="mb-4">
                <Label htmlFor="activity-category" className="block mb-1 font-medium text-slate-700">
                  Category
                </Label>
                <select
                  id="activity-category"
                  name="activity-category"
                  required
                  value={activityForm?.category || ""}
                  onChange={e => setActivityForm((f: any) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-2 py-2"
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
              <div className="mb-4">
                <Label className="block mb-1 font-medium text-slate-700">Color</Label>
                <div className="flex flex-row items-center space-x-2">
                  {ACTIVITY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center",
                        activityForm?.color === color
                          ? "border-primary ring-2 ring-primary"
                          : "border-slate-200"
                      )}
                      style={{ background: color }}
                      onClick={() => setActivityForm((f: any) => ({ ...f, color }))}
                      aria-label={`Pick color ${color}`}
                    />
                  ))}
                </div>
              </div>
              {/* Emoji Picker */}
              <div className="mb-4">
                <Label className="block mb-1 font-medium text-slate-700">Emoji Icon</Label>
                <div className="flex flex-row items-center space-x-2">
                  <Button
                    type="button"
                    className="w-12 h-12 text-2xl bg-white border border-slate-200 rounded-full shadow-none"
                    aria-label="Current activity icon"
                  >
                    {activityForm?.icon}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        className="text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg shadow-none"
                        aria-label="Pick emoji"
                      >
                        Pick Emoji
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 overflow-y-auto p-2">
                      <ScrollArea className="h-48 w-64">
                        {EMOJI_CATEGORIES.map(cat => (
                          <div key={cat.name} className="mb-2">
                            <div className="text-xs text-slate-400 mb-1">{cat.name}</div>
                            <div className="flex flex-wrap gap-1">
                              {cat.emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className={cn(
                                    "w-8 h-8 text-lg rounded-full flex items-center justify-center hover:bg-primary/10 focus:bg-primary/20 focus:outline-none"
                                  )}
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
              <DialogFooter className="mt-6 flex flex-row justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowActivityModal(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white rounded-lg px-6"
                  disabled={!activityForm?.name?.trim() || activityForm?.name?.length > 50}
                  aria-disabled={!activityForm?.name?.trim() || activityForm?.name?.length > 50}
                >
                  {activityEditId ? "Save Changes" : "Add Activity"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Activity Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm w-full rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-red-100 px-6 py-4">
              <DialogTitle className="text-xl font-bold text-red-600">
                Delete Activity
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to delete this activity? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 flex flex-row justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white rounded-lg px-6"
                onClick={() => handleDeleteActivity(deleteConfirmId!)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-slate-400 py-4 mt-auto">
          <span>
            &copy; {new Date().getFullYear()} FocusFlow. Made with <span aria-label="love">💙</span>
          </span>
        </footer>
      </div>
    </>
  );
}