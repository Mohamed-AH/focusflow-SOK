import React from "react";

/** Daily record for a single day in the heatmap */
export type DailyRecord = {
  date: string; // YYYY-MM-DD
  completion: number; // 0-100
  mood?: string; // emoji
};

interface MonthlyHeatmapProps {
  dailyRecords: DailyRecord[];
  month: number; // 0-11
  year: number;
}

function getDaysInMonth(year: number, month: number) {
  // Use UTC to ensure consistent date handling across timezones
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  return lastDayOfMonth.getUTCDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // Use UTC date to ensure consistent day calculation
  return new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 (Sun) - 6 (Sat)
}

function getColor(completion: number | null) {
  if (completion === null) return "bg-muted";
  if (completion >= 80) return "bg-green-500";
  if (completion >= 50) return "bg-yellow-400";
  if (completion > 0) return "bg-red-400";
  return "bg-muted";
}

function getTodayISO() {
  const now = new Date();
  // Ensure consistent UTC date handling
  return now.toISOString().split('T')[0];
}

export const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({
  dailyRecords,
  month,
  year,
}) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const todayISO = getTodayISO();

  // Map dailyRecords by date for quick lookup
  const recordMap: Record<string, DailyRecord> = {};
  dailyRecords.forEach((rec) => {
    recordMap[rec.date] = rec;
  });

  // Build grid: 7 columns (Sun-Sat), up to 6 rows
  const cells: {
    date: string | null;
    completion: number | null;
    mood?: string;
    isFuture: boolean;
  }[] = [];

  // Fill leading empty days
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ date: null, completion: null, isFuture: false });
  }

  // Fill days of month
  for (let day = 1; day <= daysInMonth; day++) {
    // Create date in UTC to ensure consistent date handling
    const dateObj = new Date(Date.UTC(year, month, day));
    const dateISO = dateObj.toISOString().split('T')[0];
    const rec = recordMap[dateISO];
    const isFuture = dateISO > todayISO;
    cells.push({
      date: dateISO,
      completion: rec ? rec.completion : null,
      mood: rec ? rec.mood : undefined,
      isFuture,
    });
  }

  // Fill trailing empty days to complete the last week
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, completion: null, isFuture: false });
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Monthly Progress</h3>
        {/* Month/Year label */}
        <span className="text-muted-foreground text-sm">
          {new Date(Date.UTC(year, month)).toLocaleString(undefined, {
            month: "long",
            year: "numeric",
            timeZone: "UTC"
          })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 bg-card p-2 rounded-lg shadow-sm">
        {/* Weekday headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => (
          <div
            key={`weekday-${idx}`}
            className="text-xs text-muted-foreground text-center font-medium pb-1"
          >
            {d[0]}
          </div>
        ))}
        {/* Day cells */}
        {cells.map((cell, idx) =>
          cell.date ? (
            <button
              key={cell.date}
              className={`aspect-square w-8 rounded-md flex flex-col items-center justify-center transition-all
                ${cell.isFuture ? "bg-muted" : getColor(cell.completion)}
                ${cell.date === todayISO ? "ring-2 ring-primary" : ""}
                hover:brightness-110 focus:outline-none`}
              title={
                cell.completion !== null
                  ? `Completion: ${cell.completion}%`
                  : "No data"
              }
              // TODO: onClick: open modal with day details
            >
              <span className="text-[10px] font-medium leading-none">
                {new Date(cell.date).getUTCDate()}
              </span>
              <span className="text-xs">
                {cell.mood ? cell.mood : ""}
              </span>
            </button>
          ) : (
            <div key={`empty-${idx}`} className="w-8 aspect-square" />
          )
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;