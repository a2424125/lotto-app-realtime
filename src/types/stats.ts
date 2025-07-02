// src/types/stats.ts
export interface NumberStats {
  number: number;
  frequency: number;
  percentage: number;
  lastAppeared: string;
  gap: number;
  trend: "hot" | "cold" | "normal";
  recentFrequency?: number;
  rankChange?: number;
}

export interface ZoneStats {
  zone: string;
  range: string;
  frequency: number;
  percentage: number;
  numbers: number[];
  expectedRatio?: number;
  color?: string;
}

export interface PatternStats {
  oddEvenRatio: { odd: number; even: number };
  consecutiveNumbers: number;
  sumRange: { min: number; max: number; avg: number; median?: number };
  numberGaps: { min: number; max: number; avg: number };
  sumDistribution?: { [range: string]: number };
}

export interface TrendStats {
  weeklyTrends: Array<{ week: string; frequency: number }>;
  monthlyTrends: Array<{ month: string; frequency: number }>;
  seasonalTrends: Array<{ season: string; frequency: number }>;
  yearlyTrends: Array<{ year: string; frequency: number }>;
}

export interface PrizeStats {
  totalRounds: number;
  totalPrize: number;
  avgPrize: number;
  maxPrize: number;
  minPrize: number;
  totalWinners: number;
}

export interface StatsInsight {
  type: "hot_number" | "cold_number" | "pattern_change" | "trend_shift";
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
  data?: any;
  actionable: boolean;
  confidence: number;
}

export interface StatsSummary {
  analysisDate: Date;
  dataRange: {
    value: string;
    label: string;
    description: string;
    dataCount: number;
  };
  totalNumbers: number;
  mostFrequent: number[];
  leastFrequent: number[];
  currentTrend: "rising" | "falling" | "stable";
  confidenceScore: number;
  insights: string[];
}
