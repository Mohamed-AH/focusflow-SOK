import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(baseDate: Date) {
  // Returns array of 7 Date objects for the week containing baseDate (Sunday to Saturday)
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getColorByCompletion(pct: number | undefined) {
  if (pct === undefined || pct === null) return "bg-white/10 text-slate-400 border border-white/20";
  if (pct >= 80) return "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/30 border border-green-300";
  if (pct >= 50) return "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30 border border-amber-300";
  if (pct > 0) return "bg-gradient-to-br from-coral-400 to-coral-500 text-white shadow-md shadow-coral-500/30 border border-coral-300";
  return "bg-white/10 text-slate-400 border border-white/20";
}

function getMoodEmoji(pct: number | undefined) {
  if (pct === undefined || pct === null) return "⬜";
  if (pct >= 80) return "🟩";
  if (pct >= 50) return "🟨";
  if (pct > 0) return "🟥";
  return "⬜";
}

interface WeeklyOverviewProps {
  dailyRecords: Record<string, any>;
  weekOffset?: number; // 0 = current, -1 = prev, +1 = next
  onDayClick?: (date: string) => void;
}

export const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  dailyRecords,
  weekOffset = 0,
  onDayClick,
}) => {
  const [detailDay, setDetailDay] = useState<string | null>(null);

  // Calculate week dates
  const today = new Date();
  const base = new Date(today);
  base.setDate(today.getDate() + (weekOffset * 7));
  const weekDates = useMemo(() => getWeekDates(base), [base]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-row items-center justify-between w-full mb-3">
        <span className="text-lg font-display font-bold text-white">This Week</span>
        {/* Week navigation (future: add prev/next) */}
      </div>
      <div className="grid grid-cols-7 gap-2.5 w-full">
        {weekDates.map((date, idx) => {
          const key = getDayKey(date);
          const record = dailyRecords?.[key];
          const pct = record?.completionRate;
          const isToday = key === getDayKey(today);
          return (
            <motion.button
              key={key}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-300 focus:outline-none backdrop-blur-sm",
                getColorByCompletion(pct),
                isToday && "ring-2 ring-electric-500 shadow-lg shadow-electric-500/30"
              )}
              style={{ minWidth: 42, minHeight: 56 }}
              onClick={() => onDayClick ? onDayClick(key) : setDetailDay(key)}
              aria-label={`Show details for ${date.toLocaleDateString()}`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: idx * 0.04 }}
            >
              <span className="text-xs font-sans font-medium uppercase tracking-wide">{DAY_LABELS[date.getDay()]}</span>
              <span className="text-base font-display font-bold mt-0.5">{date.getDate()}</span>
              <span className="text-xl mt-1">{getMoodEmoji(pct)}</span>
              <span className="text-xs font-display font-bold mt-0.5">{pct !== undefined ? `${pct}%` : ""}</span>
            </motion.button>
          );
        })}
      </div>
      {/* Detail Modal */}
      <AnimatePresence>
        {detailDay && (
          <Dialog open={!!detailDay} onOpenChange={() => setDetailDay(null)}>
            <DialogContent className="max-w-xs w-full rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="bg-primary/10 px-4 py-3">
                <DialogTitle className="text-lg font-bold text-primary">
                  Day Details
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {detailDay}
                </DialogDescription>
              </DialogHeader>
              <div className="px-4 py-3">
                {dailyRecords?.[detailDay] ? (
                  <>
                    <div className="mb-2">
                      <span className="font-semibold">Completion:</span>{" "}
                      <span>{dailyRecords[detailDay].completionRate}%</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Time Focused:</span>{" "}
                      <span>{dailyRecords[detailDay].totalCompletedTime || 0} min</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Activities:</span>
                      <ul className="list-disc ml-5 text-sm">
                        {dailyRecords[detailDay].activities
                          ? Object.values(dailyRecords[detailDay].activities).map((a: any, i: number) => (
                              <li key={i}>
                                {a.completed ? "✅" : "⬜"} {a.planned ? a.name || "Activity" : "Unplanned"}
                              </li>
                            ))
                          : <li>No activities</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400">No data for this day.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyOverview;