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
  // Card color logic
  let bg = "bg-white";
  let border = "border-slate-200";
  let text = "text-slate-800";
  let accent = activity.color || COLOR_PALETTE.primary;
  let ring = "";
  if (state === "inprogress") {
    bg = "bg-primary/10";
    border = "border-primary";
    ring = "animate-pulse";
  } else if (state === "completed") {
    bg = "bg-green-100";
    border = "border-green-400";
    text = "text-green-700";
  }

  return (
    <motion.div
      className={cn(
        "flex flex-row items-center w-full rounded-2xl border px-3 py-3 mb-2 transition-all duration-200 group",
        bg,
        border,
        ring,
        "shadow-none"
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      layout
      tabIndex={0}
      aria-label={`Activity: ${activity.name}`}
      onDoubleClick={onEdit}
      onContextMenu={e => {
        e.preventDefault();
        if (onEdit) onEdit();
      }}
    >
      {/* Left: Checkbox */}
      <button
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full border-2 mr-3 transition-all duration-200",
          state === "completed"
            ? "border-green-500 bg-green-500 text-white"
            : "border-slate-300 bg-white text-slate-400 hover:border-primary focus:ring-2 focus:ring-primary"
        )}
        aria-label={state === "completed" ? "Mark as incomplete" : "Mark as complete"}
        onClick={onCheck}
        tabIndex={0}
      >
        {state === "completed" ? (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg"
          >
            ✓
          </motion.span>
        ) : (
          <span className="text-lg"> </span>
        )}
      </button>
      {/* Center: Name, duration, category, progress bar */}
      <div className="flex-1 flex flex-col min-w-0" onClick={onEdit} style={{ cursor: "pointer" }}>
        <span className={cn("text-base font-semibold truncate", text)}>{activity.name}</span>
        <span className="text-xs text-slate-500 mt-0.5">
          {activity.startTime ? formatTime(activity.startTime) + ' • ' : ''}{activity.duration} min &middot; {activity.category}
        </span>
        {/* Progress bar (placeholder for now) */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: state === "completed" ? "100%" : state === "inprogress" ? "50%" : "0%",
              background: accent,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
      {/* Right: Emoji, accent bar, timer icon, drag handle, delete */}
      <div className="flex flex-col items-center ml-3 space-y-1">
        <span className="text-2xl" aria-label="Activity icon">{activity.icon}</span>
        <div
          className="w-1 h-8 rounded-full"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <span className="text-xs text-slate-400" aria-label="Start timer">⏱️</span>
        <button
          className="mt-1 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete activity"
          onClick={onDelete}
          tabIndex={0}
        >
          🗑️
        </button>
        <button
          {...dragHandleProps}
          className="mt-1 text-xs text-slate-400 cursor-grab active:cursor-grabbing"
          aria-label="Reorder activity"
          tabIndex={0}
        >
          <span className="text-lg">☰</span>
        </button>
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
            {/* Header */}
            <header className="w-full max-w-2xl mx-auto pt-8 pb-2 px-4 flex flex-col items-center">
              <motion.img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                alt="FocusFlow background"
                className="rounded-2xl w-full h-40 object-cover mb-4 shadow-none"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                aria-hidden="true"
              />
              <motion.h1
                className="text-3xl md:text-4xl font-extrabold text-primary text-center"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Welcome to FocusFlow
              </motion.h1>
              <motion.p
                className="text-lg text-slate-600 mt-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Beat the Scroll, Build Focus
              </motion.p>
            </header>
            {/* Profile Selection */}
            <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center px-4 pb-8">
              <div className="w-full flex flex-row justify-between items-center mt-6 mb-2">
                <h2 className="text-xl font-semibold text-slate-800">Your Profiles</h2>
                <Button
                  aria-label="Create New Profile"
                  className="bg-primary text-white rounded-full px-4 py-2 text-base font-medium shadow-none"
                  onClick={() => setShowCreateModal(true)}
                >
                  <span className="mr-2 text-lg">+</span> Create New Profile
                </Button>
              </div>
              <AnimatePresence>
                {loading ? (
                  <motion.div
                    className="w-full flex justify-center items-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-slate-400 text-lg">Loading...</span>
                  </motion.div>
                ) : profiles.length === 0 ? (
                  <motion.div
                    className="w-full flex flex-col items-center justify-center py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80"
                      alt="Create your first profile"
                      className="w-32 h-32 object-cover rounded-full mb-4"
                      aria-hidden="true"
                    />
                    <p className="text-slate-500 text-lg mb-2">Create your first profile to get started</p>
                    <Button
                      aria-label="Create New Profile"
                      className="bg-primary text-white rounded-full px-6 py-2 text-base font-medium shadow-none"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <span className="mr-2 text-lg">+</span> Create Profile
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.08 } },
                    }}
                  >
                    {profiles.map((profile: any, idx: number) => (
                      <motion.button
                        key={profile.id}
                        className={cn(
                          "flex flex-row items-center w-full bg-white rounded-2xl border border-slate-200 px-4 py-4 transition-all duration-200",
                          "hover:scale-[1.025] focus:ring-2 focus:ring-primary focus:outline-none",
                          currentProfileId === profile.id
                            ? "ring-2 ring-primary"
                            : "hover:border-primary/60",
                          "shadow-none"
                        )}
                        style={{
                          background: currentProfileId === profile.id
                            ? `linear-gradient(90deg, ${COLOR_PALETTE[profile.type as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.primary}11 0%, #fff 100%)`
                            : "#fff",
                        }}
                        onClick={() => handleProfileSwitch(profile.id)}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        aria-label={`Select profile ${profile.name}`}
                      >
                        <Avatar className="w-14 h-14 mr-4 border-2 border-slate-200">
                          <AvatarFallback
                            className={cn(
                              "flex h-full w-full items-center justify-center rounded-full select-none",
                              "text-4xl leading-none",
                              // Profile type color background
                              {
                                "bg-[#8B5CF6] text-white": profile.type === "student",
                                "bg-[#3B82F6] text-white": profile.type === "professional" || profile.type === "custom",
                                "bg-[#F59E0B] text-white": profile.type === "entrepreneur",
                                "bg-[#EC4899] text-white": profile.type === "creative",
                                "bg-[#10B981] text-white": profile.type === "mom",
                              }
                            )}
                            aria-label="Profile avatar"
                          >
                            {profile.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex flex-col items-start">
                          <span className="text-lg font-semibold text-slate-800">{profile.name}</span>
                          <span className="text-xs text-slate-500 mt-0.5 flex items-center">
                            <span className="mr-2" aria-label="Profile type">{PROFILE_TYPES.find(t => t.key === profile.type)?.emoji}</span>
                            {PROFILE_TYPES.find(t => t.key === profile.type)?.label}
                          </span>
                          <div className="flex flex-row items-center mt-2 space-x-3">
                            <span className="flex items-center text-xs text-amber-600 font-medium" aria-label="Current streak">
                              🔥 {getCurrentStreak(profile)}d
                            </span>
                            <span className="flex items-center text-xs text-green-600 font-medium" aria-label="Completion rate">
                              ✅ {getCompletionRate(profile)}%
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {storageError && (
                <div className="w-full mt-4 text-red-600 text-sm text-center" role="alert">
                  {storageError}
                </div>
              )}
            </main>
          </>
        ) : (
          // --- Main Dashboard ---
          <main className="w-full max-w-xl mx-auto flex-1 flex flex-col items-center px-2 pb-2">
            {/* Top Bar */}
            <div className="w-full flex flex-row items-center justify-between mt-4 mb-2">
              <div className="flex flex-row items-center">
                <Avatar className="w-10 h-10 mr-2 border-2 border-slate-200">
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
                    aria-label="Profile avatar"
                  >
                    {currentProfile.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-slate-800 text-base truncate max-w-[120px]">{currentProfile.name}</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-xs text-slate-400">{getTodayDate()}</span>
                <span className="text-sm text-slate-600">{getDayOfWeek(getTodayDate())}</span>
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
            <div className="w-full flex flex-col items-center mt-2 mb-2">
              <ProgressRing
                size={160}
                animate
                ariaLabel="Today's Progress"
                layers={[
                  {
                    // Main completion ring
                    value: Math.max(0, Math.min(getCompletionRate(currentProfile) / 100, 1)),
                    color:
                      getCompletionRate(currentProfile) < 30
                        ? COLOR_PALETTE.warning
                        : getCompletionRate(currentProfile) < 70
                        ? COLOR_PALETTE.accent
                        : COLOR_PALETTE.success,
                    strokeWidth: 14,
                    pulse: getCompletionRate(currentProfile) === 100, // pulse on perfect day
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
                          strokeWidth: 2,
                          pulse: true,
                          zIndex: 3,
                        },
                      ]
                    : []),
                ]}
              >
                <span className="text-3xl font-extrabold text-slate-800">
                  {getCompletionRate(currentProfile)}%
                </span>
                <span className="text-xs text-amber-600 font-medium flex items-center mt-1" aria-label="Current streak">
                  🔥 {getCurrentStreak(currentProfile)}d
                </span>
                <span className="text-sm text-slate-500 mt-1">
                  {getCompletionRate(currentProfile) < 30
                    ? "Let's get started!"
                    : getCompletionRate(currentProfile) < 70
                    ? "Keep going!"
                    : "Amazing focus!"}
                </span>
              </ProgressRing>
            </div>
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
            <div className="w-full flex flex-row items-center justify-between mt-2 mb-2 px-2">
              <div className="flex flex-col items-start">
                <span className="text-xs text-slate-400">{getTodayDate()}</span>
                <span className="text-base font-semibold text-slate-700">{getDayOfWeek(getTodayDate())}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-amber-600">🔥 Streak</span>
                <span className="text-lg font-bold text-amber-600">{getCurrentStreak(currentProfile)}d</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-green-600">Completed</span>
                <span className="text-lg font-bold text-green-600">
                  {getCompletionRate(currentProfile)}%
                </span>
              </div>
            </div>
            {/* Activity Cards with Drag and Drop */}
            <div className="w-full flex flex-col mt-2 mb-2 px-1 relative">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Today's Activities</h3>
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
                className="fixed bottom-20 right-6 z-20 rounded-full w-14 h-14 bg-primary text-white text-3xl flex items-center justify-center shadow-lg"
                style={{ boxShadow: "0 4px 16px rgba(59,130,246,0.10)" }}
                aria-label="Add Activity"
                onClick={handleAddActivity}
              >
                +
              </Button>
            </div>
            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex flex-row items-center justify-around py-2 z-10">
              <Button
                variant="ghost"
                className="flex flex-col items-center px-2 py-1 text-accent"
                aria-label="Analytics"
                onClick={() => setShowAnalytics(true)}
              >
                <span className="text-xl">📊</span>
                <span className="text-xs">Analytics</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center px-2 py-1 text-green-500"
                aria-label="Share"
                onClick={() => setShowShare(true)}
              >
                <span className="text-xl">📤</span>
                <span className="text-xs">Share</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center px-2 py-1 text-slate-500"
                aria-label="Settings"
                onClick={() => setShowSettings(true)}
              >
                <span className="text-xl">⚙️</span>
                <span className="text-xs">Settings</span>
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