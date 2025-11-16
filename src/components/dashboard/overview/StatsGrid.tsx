/**
 * StatsGrid - Key metrics cards for Overview tab
 * Displays: Total focused time, avg completion, streaks, perfect days, etc.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateKeyMetrics, formatMinutesToHours } from '@/lib/analytics';
import {
  Clock,
  TrendingUp,
  Flame,
  Trophy,
  Star,
  Target,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Type imports
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
  type: string;
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

interface StatsGridProps {
  profile: Profile;
  days: number;
}

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-primary',
  trend,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{value}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp
                  className={cn(
                    'h-3 w-3',
                    trend.isPositive ? 'text-green-500' : 'text-red-500'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {trend.value > 0 ? '+' : ''}
                  {trend.value.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-lg p-2 sm:p-3 bg-muted flex-shrink-0', iconColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsGrid: React.FC<StatsGridProps> = ({ profile, days }) => {
  const metrics = useMemo(() => {
    return calculateKeyMetrics(profile, days);
  }, [profile, days]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Total Focused Time */}
      <StatCard
        title="Total Focused Time"
        value={formatMinutesToHours(metrics.totalFocusedTime)}
        subtitle={`Across ${metrics.totalActivitiesCompleted} activities`}
        icon={<Clock className="h-5 w-5" />}
        iconColor="text-blue-500"
      />

      {/* Average Completion Rate */}
      <StatCard
        title="Avg Completion Rate"
        value={`${metrics.averageCompletionRate.toFixed(0)}%`}
        subtitle={`${metrics.activeDays} active days`}
        icon={<Target className="h-5 w-5" />}
        iconColor="text-green-500"
      />

      {/* Current Streak */}
      <StatCard
        title="Current Streak"
        value={`${metrics.currentStreak} days`}
        subtitle={`Best: ${metrics.bestStreak} days`}
        icon={<Flame className="h-5 w-5" />}
        iconColor="text-orange-500"
      />

      {/* Perfect Days */}
      <StatCard
        title="Perfect Days"
        value={metrics.perfectDays}
        subtitle="100% completion"
        icon={<Star className="h-5 w-5" />}
        iconColor="text-yellow-500"
      />

      {/* Most Productive Day */}
      {metrics.mostProductiveDay && (
        <StatCard
          title="Most Productive Day"
          value={`${metrics.mostProductiveDay.rate.toFixed(0)}%`}
          subtitle={new Date(metrics.mostProductiveDay.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          icon={<Trophy className="h-5 w-5" />}
          iconColor="text-purple-500"
        />
      )}

      {/* Favorite Activity */}
      {metrics.favoriteActivity && (
        <StatCard
          title="Favorite Activity"
          value={
            <span className="flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl">
              <span className="text-xl sm:text-2xl">{metrics.favoriteActivity.icon}</span>
              <span className="text-sm sm:text-lg md:text-xl truncate">{metrics.favoriteActivity.name}</span>
            </span>
          }
          subtitle={`Completed ${metrics.favoriteActivity.count} times`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-pink-500"
        />
      )}

      {/* Active Days */}
      <StatCard
        title="Active Days"
        value={metrics.activeDays}
        subtitle={`Out of ${days} days`}
        icon={<Calendar className="h-5 w-5" />}
        iconColor="text-cyan-500"
      />

      {/* Completion Goal Progress */}
      <StatCard
        title="Goal Progress"
        value={`${metrics.averageCompletionRate >= profile.preferences.completionGoal ? '✓' : '○'}`}
        subtitle={`Target: ${profile.preferences.completionGoal}%`}
        icon={<Target className="h-5 w-5" />}
        iconColor={
          metrics.averageCompletionRate >= profile.preferences.completionGoal
            ? 'text-green-500'
            : 'text-gray-400'
        }
      />
    </div>
  );
};

export default StatsGrid;
