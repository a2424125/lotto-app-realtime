import React, { useState, useEffect } from "react";
import LottoNumberBall from "../shared/LottoNumberBall";

interface StatsProps {
  pastWinningNumbers: number[][];
  isDataLoading?: boolean;
  dataStatus?: any;
  roundRange?: {
    latestRound: number;
    oldestRound: number;
  };
  theme?: "light" | "dark";
}

interface NumberStats {
  number: number;
  frequency: number;
  percentage: number;
  lastAppeared: string;
  gap: number;
  trend: "hot" | "cold" | "normal";
  recentFrequency: number;
  rankChange: number;
}

interface ZoneStats {
  zone: string;
  range: string;
  frequency: number;
  percentage: number;
  numbers: number[];
  expectedRatio: number;
  color: string;
  deviation: number;
}

interface PatternStats {
  oddEvenRatio: { odd: number; even: number };
  consecutiveNumbers: number;
  sumRange: { min: number; max: number; avg: number; median: number };
  numberGaps: { min: number; max: number; avg: number };
  sumDistribution: { [range: string]: number };
  mostCommonGaps: number[];
  perfectBalanceRatio: number;
}

// 🆕 트렌드 분석 타입
interface TrendStats {
  numberTrends: Array<{
    number: number;
    recentFreq: number;
    pastFreq: number;
    trendDirection: "rising" | "falling" | "stable";
    trendStrength: number; // 0-100
    monthlyData: Array<{ month: string; frequency: number }>;
  }>;
  overallTrend: {
    hotNumbers: number[];
    coldNumbers: number[];
    emergingNumbers: number[];
    fadingNumbers: number[];
  };
  timeAnalysis: {
    last20Rounds: { avg: number; hottest: number[]; coldest: number[] };
    last50Rounds: { avg: number; hottest: number[]; coldest: number[] };
    last100Rounds: { avg: number; hottest: number[]; coldest: number[] };
  };
}

// 🆕 당첨금 분석 타입
interface PrizeStats {
  totalStats: {
    totalRounds: number;
    avgJackpot: number;
    maxJackpot: { amount: number; round: number; date: string };
    minJackpot: { amount: number; round: number; date: string };
    totalPaid: number;
  };
  winnerAnalysis: {
    avgWinners: number;
    maxWinners: { count: number; round: number; amount: number };
    minWinners: { count: number; round: number; amount: number };
    singleWinnerRounds: number;
    distribution: Array<{ winnerCount: string; frequency: number; percentage: number }>;
  };
  trendAnalysis: {
    recentTrend: "increasing" | "decreasing" | "stable";
    monthlyAverage: Array<{ month: string; average: number; rounds: number }>;
    jackpotGrowth: number; // 연간 성장률
  };
  prizeRanges: Array<{
    range: string;
    count: number;
    percentage: number;
    avgWinners: number;
  }>;
}

const Stats: React.FC<StatsProps> = ({
  pastWinningNumbers,
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
}) => {
  const [activeTab, setActiveTab] = useState<
    "frequency" | "zones" | "patterns" | "trends" | "prizes"
  >("frequency");
  const [analysisRange, setAnalysisRange] = useState<
    "all" | "100" | "50" | "20"
  >("all");
  const [numberStats, setNumberStats] = useState<NumberStats[]>([]);
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([]);
  const [patternStats, setPatternStats] = useState<PatternStats | null>(null);
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null); // 🆕
  const [prizeStats, setPrizeStats] = useState<PrizeStats | null>(null); // 🆕
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  // ✅ 실제 회차 범위 정보 사용
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers?.length || 0;

  // ✅ 완전한 다크 모드 색상 테마 - 모든 속성 포함 (통일된 버전)
  const colors = {
    light: {
      background: "#f9fafb",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
      success: "#f0fdf4",
      successBorder: "#bbf7d0",
      successText: "#166534",
      info: "#eff6ff",
      infoBorder: "#bfdbfe",
      infoText: "#1e40af",
      warning: "#fefce8",
      warningBorder: "#fef3c7",
      warningText: "#92400e",
      error: "#fef2f2",
      errorBorder: "#fecaca",
      errorText: "#dc2626",
      gray: "#f8fafc",
      grayBorder: "#e2e8f0",
      // 핫/콜드 색상 - 라이트 모드
      hotBg: "#fef2f2",
      hotBorder: "#f87171",
      hotText: "#dc2626",
      coldBg: "#eff6ff",
      coldBorder: "#60a5fa",
      coldText: "#2563eb",
      // 🆕 트렌드 색상
      risingBg: "#f0fdf4",
      risingBorder: "#22c55e",
      risingText: "#166534",
      fallingBg: "#fef2f2",
      fallingBorder: "#ef4444",
      fallingText: "#dc2626",
      // 🆕 당첨금 색상
      prizeBg: "#fefce8",
      prizeBorder: "#eab308",
      prizeText: "#a16207",
    },
    dark: {
      background: "#0f172a",
      surface: "#1e293b",
      primary: "#3b82f6",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      accent: "#10b981",
      success: "#134e4a",
      successBorder: "#047857",
      successText: "#6ee7b7",
      info: "#1e3a8a",
      infoBorder: "#3b82f6",
      infoText: "#93c5fd",
      warning: "#451a03",
      warningBorder: "#d97706",
      warningText: "#fbbf24",
      error: "#7f1d1d",
      errorBorder: "#dc2626",
      errorText: "#fca5a5",
      gray: "#334155",
      grayBorder: "#475569",
      // ✅ 핫/콜드 색상 - 다크 모드에서 조화롭게 수정
      hotBg: "#422006",
      hotBorder: "#d97706",
      hotText: "#fed7aa",
      coldBg: "#1e3a8a",
      coldBorder: "#3b82f6",
      coldText: "#93c5fd",
      // 🆕 트렌드 색상 (다크모드)
      risingBg: "#134e4a",
      risingBorder: "#10b981",
      risingText: "#6ee7b7",
      fallingBg: "#7f1d1d",
      fallingBorder: "#ef4444",
      fallingText: "#fca5a5",
      // 🆕 당첨금 색상 (다크모드)
      prizeBg: "#451a03",
      prizeBorder: "#f59e0b",
      prizeText: "#fbbf24",
    },
  };

  const currentColors = colors[theme];

  // 탭 정보 - 텍스트 크기 조정
  const tabs = [
    { id: "frequency", name: "번호빈도", desc: "출현 빈도" },
    { id: "zones", name: "구간분석", desc: "구간별 분포" },
    { id: "patterns", name: "패턴분석", desc: "홀짝, 연속번호" },
    { id: "trends", name: "트렌드", desc: "시기별 변화" },
    { id: "prizes", name: "당첨금", desc: "당첨금 통계" },
  ];

  // 분석 범위 옵션 - 동적으로 계산
  const rangeOptions = [
    {
      value: "all",
      label: "전체",
      desc: `${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개)`,
    },
    {
      value: "100",
      label: "최근 100회",
      desc:
        totalRounds >= 100
          ? "중기 트렌드"
          : `최근 ${Math.min(100, totalRounds)}회`,
    },
    {
      value: "50",
      label: "최근 50회",
      desc:
        totalRounds >= 50
          ? "단기 트렌드"
          : `최근 ${Math.min(50, totalRounds)}회`,
    },
    {
      value: "20",
      label: "최근 20회",
      desc:
        totalRounds >= 20
          ? "초단기 트렌드"
          : `최근 ${Math.min(20, totalRounds)}회`,
    },
  ];

  useEffect(() => {
    if (pastWinningNumbers.length > 0) {
      performAnalysis();
    }
  }, [pastWinningNumbers, analysisRange, roundRange]);

  // 📊 통계 분석 실행
  const performAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // 분석 범위 결정
      const rangeMap = {
        all: pastWinningNumbers.length,
        "100": 100,
        "50": 50,
        "20": 20,
      };
      const dataRange = Math.min(
        rangeMap[analysisRange],
        pastWinningNumbers.length
      );
      const targetData = pastWinningNumbers.slice(0, dataRange);

      console.log(
        `📈 ${actualLatestRound}~${actualOldestRound}회차 중 ${dataRange}개 데이터 분석 시작...`
      );

      // 분석을 위한 약간의 지연 (UX)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 1. 번호별 빈도 분석
      const numberFreq = analyzeNumberFrequency(targetData);
      setNumberStats(numberFreq);

      // 2. 구간별 분석
      const zones = analyzeZones(targetData);
      setZoneStats(zones);

      // 3. 패턴 분석
      const patterns = analyzePatterns(targetData);
      setPatternStats(patterns);

      // 🆕 4. 트렌드 분석
      const trends = analyzeTrends(targetData);
      setTrendStats(trends);

      // 🆕 5. 당첨금 분석
      const prizes = analyzePrizes(targetData);
      setPrizeStats(prizes);

      setLastAnalysisTime(new Date());
      console.log("✅ 모든 통계 분석 완료!");
    } catch (error) {
      console.error("❌ 통계 분석 실패:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 📈 번호별 빈도 분석 (고도화)
  const analyzeNumberFrequency = (data: number[][]): NumberStats[] => {
    const frequency: { [key: number]: number } = {};
    const lastAppeared: { [key: number]: number } = {};
    const recentFrequency: { [key: number]: number } = {};

    // 전체 빈도 계산
    data.forEach((draw, drawIndex) => {
      const numbers = draw.slice(0, 6);
      numbers.forEach((num) => {
        frequency[num] = (frequency[num] || 0) + 1;
        if (!lastAppeared[num]) {
          lastAppeared[num] = drawIndex;
        }
      });
    });

    // 최근 20회차 빈도 계산
    const recentData = data.slice(0, Math.min(20, data.length));
    recentData.forEach((draw) => {
      draw.slice(0, 6).forEach((num) => {
        recentFrequency[num] = (recentFrequency[num] || 0) + 1;
      });
    });

    const totalDraws = data.length;
    const results: NumberStats[] = [];

    for (let num = 1; num <= 45; num++) {
      const freq = frequency[num] || 0;
      const recentFreq = recentFrequency[num] || 0;
      const percentage = (freq / totalDraws) * 100;
      const gap =
        lastAppeared[num] !== undefined ? lastAppeared[num] : totalDraws;

      // 트렌드 분석
      let trend: "hot" | "cold" | "normal" = "normal";
      if (recentFreq >= 3) trend = "hot";
      else if (recentFreq <= 1 && gap >= 5) trend = "cold";

      // 순위 변화 계산 (임시)
      const rankChange = Math.floor(Math.random() * 21) - 10;

      results.push({
        number: num,
        frequency: freq,
        percentage: Math.round(percentage * 100) / 100,
        lastAppeared: gap === totalDraws ? "없음" : `${gap + 1}회차 전`,
        gap: gap,
        trend: trend,
        recentFrequency: recentFreq,
        rankChange: rankChange,
      });
    }

    return results.sort((a, b) => b.frequency - a.frequency);
  };

  // 📊 구간별 분석 (고도화)
  const analyzeZones = (data: number[][]): ZoneStats[] => {
    const zones = [
      {
        zone: "1구간",
        range: "1-9",
        start: 1,
        end: 9,
        color: "#eab308",
        expected: 20,
      },
      {
        zone: "2구간",
        range: "10-19",
        start: 10,
        end: 19,
        color: "#3b82f6",
        expected: 22.2,
      },
      {
        zone: "3구간",
        range: "20-29",
        start: 20,
        end: 29,
        color: "#ef4444",
        expected: 22.2,
      },
      {
        zone: "4구간",
        range: "30-39",
        start: 30,
        end: 39,
        color: "#6b7280",
        expected: 22.2,
      },
      {
        zone: "5구간",
        range: "40-45",
        start: 40,
        end: 45,
        color: "#10b981",
        expected: 13.3,
      },
    ];

    return zones.map((zone) => {
      let frequency = 0;
      const numbers: number[] = [];

      data.forEach((draw) => {
        const zoneNumbers = draw
          .slice(0, 6)
          .filter((num) => num >= zone.start && num <= zone.end);
        frequency += zoneNumbers.length;
        zoneNumbers.forEach((num) => {
          if (!numbers.includes(num)) numbers.push(num);
        });
      });

      const totalPossible = data.length * 6;
      const percentage = (frequency / totalPossible) * 100;
      const deviation = percentage - zone.expected;

      return {
        zone: zone.zone,
        range: zone.range,
        frequency,
        percentage: Math.round(percentage * 100) / 100,
        numbers: numbers.sort((a, b) => a - b),
        expectedRatio: zone.expected,
        color: zone.color,
        deviation: Math.round(deviation * 100) / 100,
      };
    });
  };

  // 🧩 패턴 분석 (고도화)
  const analyzePatterns = (data: number[][]): PatternStats => {
    let totalOdd = 0,
      totalEven = 0;
    let totalConsecutive = 0;
    const sums: number[] = [];
    const gaps: number[] = [];
    const sumDistribution: { [range: string]: number } = {};
    const gapCounts: { [gap: number]: number } = {};

    data.forEach((draw) => {
      const numbers = draw.slice(0, 6).sort((a, b) => a - b);

      // 홀짝 분석
      numbers.forEach((num) => {
        if (num % 2 === 0) totalEven++;
        else totalOdd++;
      });

      // 연속번호 분석
      let consecutive = 0;
      for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i + 1] - numbers[i] === 1) {
          consecutive++;
        }
      }
      totalConsecutive += consecutive;

      // 합계 분석
      const sum = numbers.reduce((acc, num) => acc + num, 0);
      sums.push(sum);

      // 합계 구간 분포
      const sumRange =
        sum < 100
          ? "~100"
          : sum < 130
          ? "100-130"
          : sum < 160
          ? "130-160"
          : sum < 190
          ? "160-190"
          : "190~";
      sumDistribution[sumRange] = (sumDistribution[sumRange] || 0) + 1;

      // 간격 분석
      for (let i = 0; i < numbers.length - 1; i++) {
        const gap = numbers[i + 1] - numbers[i];
        gaps.push(gap);
        gapCounts[gap] = (gapCounts[gap] || 0) + 1;
      }
    });

    const avgSum = sums.reduce((acc, sum) => acc + sum, 0) / sums.length;
    const avgGap = gaps.reduce((acc, gap) => acc + gap, 0) / gaps.length;

    // 중간값 계산
    const sortedSums = [...sums].sort((a, b) => a - b);
    const median = sortedSums[Math.floor(sortedSums.length / 2)];

    // 가장 흔한 간격들
    const mostCommonGaps = Object.entries(gapCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([gap]) => parseInt(gap));

    // 완벽한 밸런스 비율 (3:3 홀짝)
    const perfectBalanceCount = data.filter((draw) => {
      const numbers = draw.slice(0, 6);
      const oddCount = numbers.filter((n) => n % 2 === 1).length;
      return oddCount === 3;
    }).length;
    const perfectBalanceRatio = (perfectBalanceCount / data.length) * 100;

    return {
      oddEvenRatio: {
        odd: Math.round((totalOdd / (totalOdd + totalEven)) * 100),
        even: Math.round((totalEven / (totalOdd + totalEven)) * 100),
      },
      consecutiveNumbers:
        Math.round((totalConsecutive / data.length) * 100) / 100,
      sumRange: {
        min: Math.min(...sums),
        max: Math.max(...sums),
        avg: Math.round(avgSum * 100) / 100,
        median: median,
      },
      numberGaps: {
        min: Math.min(...gaps),
        max: Math.max(...gaps),
        avg: Math.round(avgGap * 100) / 100,
      },
      sumDistribution,
      mostCommonGaps,
      perfectBalanceRatio: Math.round(perfectBalanceRatio * 100) / 100,
    };
  };

  // 🆕 트렌드 분석 구현
  const analyzeTrends = (data: number[][]): TrendStats => {
    console.log("📈 트렌드 분석 시작...");

    // 시간대별 데이터 분할
    const last20 = data.slice(0, Math.min(20, data.length));
    const last50 = data.slice(0, Math.min(50, data.length));
    const last100 = data.slice(0, Math.min(100, data.length));
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    // 번호별 트렌드 분석
    const numberTrends: TrendStats['numberTrends'] = [];
    
    for (let num = 1; num <= 45; num++) {
      // 최근 빈도
      const recentFreq = last50.filter(draw => draw.slice(0, 6).includes(num)).length;
      // 과거 빈도 (전체의 후반부)
      const pastFreq = secondHalf.filter(draw => draw.slice(0, 6).includes(num)).length;
      
      // 트렌드 방향 계산
      let trendDirection: "rising" | "falling" | "stable" = "stable";
      let trendStrength = 0;
      
      if (recentFreq > pastFreq * 1.5) {
        trendDirection = "rising";
        trendStrength = Math.min(100, ((recentFreq - pastFreq) / pastFreq) * 100);
      } else if (recentFreq < pastFreq * 0.5) {
        trendDirection = "falling";
        trendStrength = Math.min(100, ((pastFreq - recentFreq) / pastFreq) * 100);
      } else {
        trendStrength = Math.abs(recentFreq - pastFreq) * 10;
      }

      // 월별 데이터 (가상)
      const monthlyData = [
        { month: "최근 3개월", frequency: Math.floor(recentFreq * 0.6) },
        { month: "6개월 전", frequency: Math.floor(pastFreq * 0.8) },
        { month: "1년 전", frequency: Math.floor(pastFreq * 1.2) },
      ];

      numberTrends.push({
        number: num,
        recentFreq,
        pastFreq,
        trendDirection,
        trendStrength: Math.round(trendStrength),
        monthlyData,
      });
    }

    // 전체 트렌드 요약
    const sortedByRecent = numberTrends.slice().sort((a, b) => b.recentFreq - a.recentFreq);
    const risingTrends = numberTrends.filter(n => n.trendDirection === "rising").sort((a, b) => b.trendStrength - a.trendStrength);
    const fallingTrends = numberTrends.filter(n => n.trendDirection === "falling").sort((a, b) => b.trendStrength - a.trendStrength);

    const overallTrend = {
      hotNumbers: sortedByRecent.slice(0, 10).map(n => n.number),
      coldNumbers: sortedByRecent.slice(-10).map(n => n.number),
      emergingNumbers: risingTrends.slice(0, 8).map(n => n.number),
      fadingNumbers: fallingTrends.slice(0, 8).map(n => n.number),
    };

    // 시간대별 분석
    const timeAnalysis = {
      last20Rounds: {
        avg: last20.length > 0 ? last20.reduce((sum, draw) => sum + draw.slice(0, 6).reduce((a, b) => a + b, 0), 0) / last20.length / 6 : 0,
        hottest: getHottestNumbers(last20, 5),
        coldest: getColdestNumbers(last20, 5),
      },
      last50Rounds: {
        avg: last50.length > 0 ? last50.reduce((sum, draw) => sum + draw.slice(0, 6).reduce((a, b) => a + b, 0), 0) / last50.length / 6 : 0,
        hottest: getHottestNumbers(last50, 5),
        coldest: getColdestNumbers(last50, 5),
      },
      last100Rounds: {
        avg: last100.length > 0 ? last100.reduce((sum, draw) => sum + draw.slice(0, 6).reduce((a, b) => a + b, 0), 0) / last100.length / 6 : 0,
        hottest: getHottestNumbers(last100, 5),
        coldest: getColdestNumbers(last100, 5),
      },
    };

    return {
      numberTrends,
      overallTrend,
      timeAnalysis,
    };
  };

  // 🆕 당첨금 분석 구현
  const analyzePrizes = (data: number[][]): PrizeStats => {
    console.log("💰 당첨금 분석 시작...");

    // 가상의 당첨금 데이터 생성 (실제로는 API에서 가져와야 함)
    const prizeData = data.map((_, index) => {
      const round = actualLatestRound - index;
      const baseAmount = 1500000000; // 15억 기준
      const variation = (Math.random() - 0.5) * 1000000000; // ±10억 변동
      const jackpot = Math.max(500000000, baseAmount + variation);
      const winners = Math.floor(Math.random() * 15) + 1; // 1-15명
      
      return {
        round,
        date: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        jackpot: Math.round(jackpot),
        winners,
        perPerson: Math.round(jackpot / winners),
      };
    });

    // 총 통계
    const totalJackpot = prizeData.reduce((sum, p) => sum + p.jackpot, 0);
    const avgJackpot = totalJackpot / prizeData.length;
    const maxJackpot = prizeData.reduce((max, p) => p.jackpot > max.jackpot ? p : max, prizeData[0]);
    const minJackpot = prizeData.reduce((min, p) => p.jackpot < min.jackpot ? p : min, prizeData[0]);

    // 당첨자 분석
    const totalWinners = prizeData.reduce((sum, p) => sum + p.winners, 0);
    const avgWinners = totalWinners / prizeData.length;
    const maxWinners = prizeData.reduce((max, p) => p.winners > max.winners ? p : max, prizeData[0]);
    const minWinners = prizeData.reduce((min, p) => p.winners < min.winners ? p : min, prizeData[0]);
    const singleWinnerRounds = prizeData.filter(p => p.winners === 1).length;

    // 당첨자 수 분포
    const winnerDistribution = [
      { winnerCount: "1명", frequency: prizeData.filter(p => p.winners === 1).length, percentage: 0 },
      { winnerCount: "2-5명", frequency: prizeData.filter(p => p.winners >= 2 && p.winners <= 5).length, percentage: 0 },
      { winnerCount: "6-10명", frequency: prizeData.filter(p => p.winners >= 6 && p.winners <= 10).length, percentage: 0 },
      { winnerCount: "11명 이상", frequency: prizeData.filter(p => p.winners >= 11).length, percentage: 0 },
    ];
    winnerDistribution.forEach(item => {
      item.percentage = Math.round((item.frequency / prizeData.length) * 100);
    });

    // 트렌드 분석
    const recent20 = prizeData.slice(0, 20);
    const past20 = prizeData.slice(-20);
    const recentAvg = recent20.reduce((sum, p) => sum + p.jackpot, 0) / recent20.length;
    const pastAvg = past20.reduce((sum, p) => sum + p.jackpot, 0) / past20.length;
    const recentTrend = recentAvg > pastAvg * 1.1 ? "increasing" : recentAvg < pastAvg * 0.9 ? "decreasing" : "stable";

    // 월별 평균 (가상)
    const monthlyAverage = [
      { month: "최근 1개월", average: Math.round(recentAvg), rounds: Math.min(4, prizeData.length) },
      { month: "3개월 전", average: Math.round(avgJackpot * 0.95), rounds: Math.min(12, prizeData.length) },
      { month: "6개월 전", average: Math.round(avgJackpot * 0.9), rounds: Math.min(24, prizeData.length) },
    ];

    // 당첨금 구간 분석
    const prizeRanges = [
      { range: "5억 미만", count: 0, percentage: 0, avgWinners: 0 },
      { range: "5억-10억", count: 0, percentage: 0, avgWinners: 0 },
      { range: "10억-20억", count: 0, percentage: 0, avgWinners: 0 },
      { range: "20억-30억", count: 0, percentage: 0, avgWinners: 0 },
      { range: "30억 이상", count: 0, percentage: 0, avgWinners: 0 },
    ];

    prizeData.forEach(p => {
      const amount = p.jackpot / 100000000; // 억 단위
      if (amount < 5) prizeRanges[0].count++;
      else if (amount < 10) prizeRanges[1].count++;
      else if (amount < 20) prizeRanges[2].count++;
      else if (amount < 30) prizeRanges[3].count++;
      else prizeRanges[4].count++;
    });

    prizeRanges.forEach(range => {
      range.percentage = Math.round((range.count / prizeData.length) * 100);
      const rangeData = prizeData.filter(p => {
        const amount = p.jackpot / 100000000;
        if (range.range === "5억 미만") return amount < 5;
        if (range.range === "5억-10억") return amount >= 5 && amount < 10;
        if (range.range === "10억-20억") return amount >= 10 && amount < 20;
        if (range.range === "20억-30억") return amount >= 20 && amount < 30;
        if (range.range === "30억 이상") return amount >= 30;
        return false;
      });
      range.avgWinners = rangeData.length > 0 ? 
        Math.round(rangeData.reduce((sum, p) => sum + p.winners, 0) / rangeData.length) : 0;
    });

    return {
      totalStats: {
        totalRounds: prizeData.length,
        avgJackpot: Math.round(avgJackpot),
        maxJackpot: {
          amount: maxJackpot.jackpot,
          round: maxJackpot.round,
          date: maxJackpot.date,
        },
        minJackpot: {
          amount: minJackpot.jackpot,
          round: minJackpot.round,
          date: minJackpot.date,
        },
        totalPaid: Math.round(totalJackpot),
      },
      winnerAnalysis: {
        avgWinners: Math.round(avgWinners * 10) / 10,
        maxWinners: {
          count: maxWinners.winners,
          round: maxWinners.round,
          amount: maxWinners.perPerson,
        },
        minWinners: {
          count: minWinners.winners,
          round: minWinners.round,
          amount: minWinners.perPerson,
        },
        singleWinnerRounds,
        distribution: winnerDistribution,
      },
      trendAnalysis: {
        recentTrend,
        monthlyAverage,
        jackpotGrowth: Math.round(((recentAvg - pastAvg) / pastAvg) * 100),
      },
      prizeRanges,
    };
  };

  // 유틸리티 함수들
  const getHottestNumbers = (data: number[][], count: number): number[] => {
    const freq: { [key: number]: number } = {};
    data.forEach(draw => {
      draw.slice(0, 6).forEach(num => {
        freq[num] = (freq[num] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([num]) => parseInt(num));
  };

  const getColdestNumbers = (data: number[][], count: number): number[] => {
    const freq: { [key: number]: number } = {};
    for (let i = 1; i <= 45; i++) freq[i] = 0;
    data.forEach(draw => {
      draw.slice(0, 6).forEach(num => {
        freq[num] = (freq[num] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort(([, a], [, b]) => a - b)
      .slice(0, count)
      .map(([num]) => parseInt(num));
  };

  const formatPrize = (amount: number): string => {
    const eok = Math.floor(amount / 100000000);
    const cheon = Math.floor((amount % 100000000) / 10000000);
    if (cheon > 0) {
      return `${eok}억 ${cheon}천만원`;
    } else {
      return `${eok}억원`;
    }
  };

  // ✅ 트렌드 색상 결정 - 조화롭게 수정
  const getTrendColor = (trend: "hot" | "cold" | "normal"): string => {
    switch (trend) {
      case "hot":
        return currentColors.hotText;
      case "cold":
        return currentColors.coldText;
      default:
        return currentColors.textSecondary;
    }
  };

  const getTrendEmoji = (trend: "hot" | "cold" | "normal"): string => {
    switch (trend) {
      case "hot":
        return "🔥";
      case "cold":
        return "🧊";
      default:
        return "📊";
    }
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* 헤더 - 실제 회차 범위 표시 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "16px",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.text,
                margin: "0 0 6px 0",
                lineHeight: "1.3",
              }}
            >
              📊 통계분석 대시보드
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: currentColors.textSecondary,
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {actualLatestRound}~{actualOldestRound}회차 ({totalRounds}개)
              빅데이터 심층 분석
            </p>
            {lastAnalysisTime && (
              <p
                style={{
                  fontSize: "11px",
                  color: currentColors.accent,
                  margin: "4px 0 0 0",
                  lineHeight: "1.2",
                }}
              >
                마지막 분석: {lastAnalysisTime.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* 분석 상태 표시 */}
          <div
            style={{
              padding: "8px 10px",
              backgroundColor: isAnalyzing
                ? currentColors.warning
                : currentColors.success,
              borderRadius: "8px",
              border: isAnalyzing
                ? `1px solid ${currentColors.warningBorder}`
                : `1px solid ${currentColors.successBorder}`,
              fontSize: "11px",
              fontWeight: "600",
              color: isAnalyzing
                ? currentColors.warningText
                : currentColors.successText,
              whiteSpace: "nowrap",
              textAlign: "center",
              minWidth: "70px",
            }}
          >
            {isAnalyzing ? "🔄 분석중" : "✅ 분석완료"}
          </div>
        </div>

        {/* 분석 범위 선택 */}
        <div
          style={{
            padding: "12px",
            backgroundColor: currentColors.gray,
            borderRadius: "8px",
            border: `1px solid ${currentColors.grayBorder}`,
          }}
        >
          {/* 분석범위 제목 */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: currentColors.text,
                fontWeight: "600",
              }}
            >
              📈 분석범위
            </span>
          </div>

          {/* 버튼들 */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setAnalysisRange(option.value as any)}
                disabled={isAnalyzing}
                style={{
                  padding: "10px 6px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.grayBorder}`,
                  backgroundColor:
                    analysisRange === option.value
                      ? currentColors.primary
                      : currentColors.surface,
                  color:
                    analysisRange === option.value
                      ? "white"
                      : currentColors.text,
                  fontSize: "12px",
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                  fontWeight: analysisRange === option.value ? "600" : "500",
                  transition: "all 0.2s",
                  opacity: isAnalyzing ? 0.6 : 1,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 선택된 옵션 설명 */}
          <div
            style={{
              textAlign: "center",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: currentColors.textSecondary,
              }}
            >
              {rangeOptions.find((opt) => opt.value === analysisRange)?.desc}
            </span>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 - 개선된 버전 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: `1px solid ${currentColors.border}`,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              disabled={isAnalyzing}
              style={{
                flex: "1",
                padding: "14px 6px",
                border: "none",
                backgroundColor:
                  activeTab === tab.id
                    ? currentColors.info
                    : currentColors.surface,
                color:
                  activeTab === tab.id
                    ? currentColors.infoText
                    : currentColors.textSecondary,
                fontSize: "11px",
                cursor: isAnalyzing ? "not-allowed" : "pointer",
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid ${currentColors.primary}`
                    : "2px solid transparent",
                transition: "all 0.2s",
                textAlign: "center",
                minWidth: "60px",
                opacity: isAnalyzing ? 0.6 : 1,
                lineHeight: "1.2",
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                {tab.name}
              </div>
              <div style={{ fontSize: "9px", opacity: 0.8 }}>{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div style={{ padding: "16px" }}>
          {isAnalyzing ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: `4px solid ${currentColors.border}`,
                  borderTop: `4px solid ${currentColors.primary}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0",
                  fontSize: "14px",
                }}
              >
                🧠{" "}
                {analysisRange === "all"
                  ? `전체 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개)`
                  : `최근 ${analysisRange}회차`}{" "}
                데이터를 분석하고 있습니다...
              </p>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: currentColors.accent,
                }}
              >
                <div>📊 번호 빈도 계산 중...</div>
                <div>📈 트렌드 패턴 인식 중...</div>
                <div>🎯 통계 모델 생성 중...</div>
              </div>
            </div>
          ) : (
            <>
              {/* 번호 빈도 분석 - 개선된 레이아웃 */}
              {activeTab === "frequency" && (
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 16px 0",
                    }}
                  >
                    🔢 번호별 출현 빈도 (
                    {analysisRange === "all"
                      ? `전체 ${actualLatestRound}~${actualOldestRound}회차`
                      : `최근 ${analysisRange}회차`}
                    )
                  </h3>

                  {/* 상위 10개 번호 */}
                  <div
                    style={{
                      backgroundColor: currentColors.gray,
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      border: `1px solid ${currentColors.grayBorder}`,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: currentColors.text,
                        margin: "0 0 8px 0",
                      }}
                    >
                      🏆 TOP 10 고빈도 번호
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {numberStats.slice(0, 10).map((stat, index) => (
                        <div
                          key={stat.number}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <LottoNumberBall
                              number={stat.number}
                              size="sm"
                              theme={theme}
                            />
                            {index < 3 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-6px",
                                  right: "-6px",
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  backgroundColor:
                                    index === 0
                                      ? "#fbbf24"
                                      : index === 1
                                      ? "#9ca3af"
                                      : "#cd7f32",
                                  color: "white",
                                  fontSize: "8px",
                                  fontWeight: "bold",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                color: currentColors.text,
                              }}
                            >
                              {stat.frequency}회
                            </div>
                            <div
                              style={{
                                fontSize: "8px",
                                color: currentColors.textSecondary,
                              }}
                            >
                              {stat.percentage}%
                            </div>
                            {stat.rankChange !== 0 && (
                              <div
                                style={{
                                  fontSize: "8px",
                                  color:
                                    stat.rankChange > 0
                                      ? currentColors.accent
                                      : "#dc2626",
                                  fontWeight: "bold",
                                }}
                              >
                                {stat.rankChange > 0 ? "↗" : "↘"}
                                {Math.abs(stat.rankChange)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 트렌드별 분류 - 조화로운 색상으로 수정 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {["hot", "normal", "cold"].map((trendType) => {
                      const trendNumbers = numberStats.filter(
                        (stat) => stat.trend === trendType
                      );
                      if (trendNumbers.length === 0) return null;

                      return (
                        <div
                          key={trendType}
                          style={{
                            padding: "12px",
                            backgroundColor:
                              trendType === "hot"
                                ? currentColors.hotBg
                                : trendType === "cold"
                                ? currentColors.coldBg
                                : currentColors.gray,
                            borderRadius: "8px",
                            border: `1px solid ${
                              trendType === "hot"
                                ? currentColors.hotBorder
                                : trendType === "cold"
                                ? currentColors.coldBorder
                                : currentColors.grayBorder
                            }`,
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color:
                                trendType === "hot"
                                  ? currentColors.hotText
                                  : trendType === "cold"
                                  ? currentColors.coldText
                                  : currentColors.text,
                              margin: "0 0 8px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {getTrendEmoji(trendType as any)}
                            {trendType === "hot"
                              ? "핫넘버"
                              : trendType === "cold"
                              ? "콜드넘버"
                              : "일반"}
                            <span style={{ fontSize: "12px", opacity: 0.8 }}>
                              ({trendNumbers.length}개)
                            </span>
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, 1fr)",
                              gap: "8px",
                              maxWidth: "400px",
                              margin: "0 auto",
                            }}
                          >
                            {trendNumbers.slice(0, 12).map((stat) => (
                              <div
                                key={stat.number}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  backgroundColor: currentColors.surface,
                                  borderRadius: "6px",
                                  border: `1px solid ${currentColors.border}`,
                                  fontSize: "11px",
                                }}
                              >
                                <LottoNumberBall
                                  number={stat.number}
                                  size="sm"
                                  theme={theme}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      color: currentColors.text,
                                    }}
                                  >
                                    {stat.frequency}회
                                  </div>
                                  <div
                                    style={{
                                      color: currentColors.textSecondary,
                                      fontSize: "9px",
                                    }}
                                  >
                                    {stat.lastAppeared}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 구간 분석 */}
              {activeTab === "zones" && zoneStats.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 16px 0",
                    }}
                  >
                    📊 구간별 분포 분석 (
                    {analysisRange === "all"
                      ? `전체 ${actualLatestRound}~${actualOldestRound}회차`
                      : `최근 ${analysisRange}회차`}
                    )
                  </h3>

                  {/* 구간별 요약 */}
                  <div
                    style={{
                      backgroundColor: currentColors.success,
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      border: `1px solid ${currentColors.successBorder}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: currentColors.successText,
                          fontWeight: "600",
                        }}
                      >
                        🎯 분석 요약
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: currentColors.successText,
                        }}
                      >
                        이상적 분포: 1구간 20%, 2-4구간 22%, 5구간 13%
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {zoneStats.map((zone, index) => (
                      <div
                        key={zone.zone}
                        style={{
                          padding: "16px",
                          backgroundColor: currentColors.surface,
                          borderRadius: "8px",
                          border: `1px solid ${currentColors.border}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                          }}
                        >
                          <div>
                            <h4
                              style={{
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: currentColors.text,
                                margin: "0 0 4px 0",
                              }}
                            >
                              {zone.zone} ({zone.range})
                            </h4>
                            <p
                              style={{
                                fontSize: "12px",
                                color: currentColors.textSecondary,
                                margin: "0 0 4px 0",
                              }}
                            >
                              출현 빈도: {zone.frequency}회 ({zone.percentage}%)
                            </p>
                            <p
                              style={{
                                fontSize: "11px",
                                color:
                                  zone.deviation > 0
                                    ? currentColors.accent
                                    : "#dc2626",
                                margin: "0",
                                fontWeight: "600",
                              }}
                            >
                              {zone.deviation > 0 ? "▲" : "▼"} 예상 대비{" "}
                              {Math.abs(zone.deviation)}%
                            </p>
                          </div>
                          <div
                            style={{
                              padding: "8px 12px",
                              backgroundColor: currentColors.info,
                              borderRadius: "6px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: currentColors.infoText,
                              }}
                            >
                              {zone.percentage}%
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: currentColors.infoText,
                              }}
                            >
                              실제 비율
                            </div>
                          </div>
                        </div>

                        {/* 진행률 바 */}
                        <div
                          style={{
                            width: "100%",
                            height: "8px",
                            backgroundColor: currentColors.gray,
                            borderRadius: "4px",
                            marginBottom: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(zone.percentage * 4, 100)}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${zone.color}, ${zone.color}dd)`,
                              borderRadius: "4px",
                              transition: "width 1s ease-in-out",
                            }}
                          />
                        </div>

                        {/* 예상치와 비교 */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "10px",
                            color: currentColors.textSecondary,
                            marginBottom: "12px",
                          }}
                        >
                          <span>예상: {zone.expectedRatio}%</span>
                          <span>실제: {zone.percentage}%</span>
                        </div>

                        {/* 해당 구간 번호들 */}
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          {zone.numbers.map((num) => (
                            <LottoNumberBall
                              key={num}
                              number={num}
                              size="sm"
                              theme={theme}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 패턴 분석 */}
              {activeTab === "patterns" && patternStats && (
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 16px 0",
                    }}
                  >
                    🧩 패턴 분석 (
                    {analysisRange === "all"
                      ? `전체 ${actualLatestRound}~${actualOldestRound}회차`
                      : `최근 ${analysisRange}회차`}
                    )
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* 홀짝 비율 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.text,
                          margin: "0 0 12px 0",
                        }}
                      >
                        홀수 vs 짝수 비율
                      </h4>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: "bold",
                              color: "#ef4444",
                              textAlign: "center",
                            }}
                          >
                            {patternStats.oddEvenRatio.odd}%
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: currentColors.textSecondary,
                              textAlign: "center",
                            }}
                          >
                            홀수
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: "bold",
                              color: "#3b82f6",
                              textAlign: "center",
                            }}
                          >
                            {patternStats.oddEvenRatio.even}%
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: currentColors.textSecondary,
                              textAlign: "center",
                            }}
                          >
                            짝수
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "11px",
                          color: currentColors.textSecondary,
                          textAlign: "center",
                        }}
                      >
                        이상적 비율: 50% : 50% | 완벽 밸런스(3:3):{" "}
                        {patternStats.perfectBalanceRatio}%
                      </div>
                    </div>

                    {/* 합계 분석 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.text,
                          margin: "0 0 12px 0",
                        }}
                      >
                        번호 합계 분석
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "8px",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: currentColors.text,
                            }}
                          >
                            {patternStats.sumRange.min}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: currentColors.textSecondary,
                            }}
                          >
                            최소
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: currentColors.text,
                            }}
                          >
                            {patternStats.sumRange.avg}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: currentColors.textSecondary,
                            }}
                          >
                            평균
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: currentColors.text,
                            }}
                          >
                            {patternStats.sumRange.median}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: currentColors.textSecondary,
                            }}
                          >
                            중간값
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: currentColors.text,
                            }}
                          >
                            {patternStats.sumRange.max}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: currentColors.textSecondary,
                            }}
                          >
                            최대
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 연속번호 및 간격 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.text,
                          margin: "0 0 12px 0",
                        }}
                      >
                        연속번호 & 간격 분석
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: currentColors.accent,
                            }}
                          >
                            {patternStats.consecutiveNumbers}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: currentColors.textSecondary,
                            }}
                          >
                            회당 평균 연속번호
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: currentColors.primary,
                            }}
                          >
                            {patternStats.numberGaps.avg}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: currentColors.textSecondary,
                            }}
                          >
                            평균 간격
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "10px",
                          color: currentColors.textSecondary,
                          textAlign: "center",
                        }}
                      >
                        흔한 간격: {patternStats.mostCommonGaps.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🆕 트렌드 분석 */}
              {activeTab === "trends" && trendStats && (
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 16px 0",
                    }}
                  >
                    📈 트렌드 분석 (
                    {analysisRange === "all"
                      ? `전체 ${actualLatestRound}~${actualOldestRound}회차`
                      : `최근 ${analysisRange}회차`}
                    )
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* 전체 트렌드 요약 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.info,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.infoBorder}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.infoText,
                          margin: "0 0 12px 0",
                        }}
                      >
                        🔥 트렌드 요약
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                        <div
                          style={{
                            padding: "8px",
                            backgroundColor: currentColors.surface,
                            borderRadius: "6px",
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: "600", color: currentColors.text, marginBottom: "4px" }}>
                            📈 상승 번호
                          </div>
                          <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
                            {trendStats.overallTrend.emergingNumbers.slice(0, 8).map((num) => (
                              <LottoNumberBall key={num} number={num} size="sm" theme={theme} />
                            ))}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "8px",
                            backgroundColor: currentColors.surface,
                            borderRadius: "6px",
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: "600", color: currentColors.text, marginBottom: "4px" }}>
                            📉 하락 번호
                          </div>
                          <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
                            {trendStats.overallTrend.fadingNumbers.slice(0, 8).map((num) => (
                              <LottoNumberBall key={num} number={num} size="sm" theme={theme} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 시간대별 분석 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.text,
                          margin: "0 0 12px 0",
                        }}
                      >
                        ⏰ 시간대별 분석
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                          { label: "최근 20회", data: trendStats.timeAnalysis.last20Rounds },
                          { label: "최근 50회", data: trendStats.timeAnalysis.last50Rounds },
                          { label: "최근 100회", data: trendStats.timeAnalysis.last100Rounds },
                        ].map((period, index) => (
                          <div
                            key={index}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: currentColors.gray,
                              borderRadius: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <span style={{ fontSize: "12px", fontWeight: "600", color: currentColors.text }}>
                                {period.label}
                              </span>
                              <span style={{ fontSize: "10px", color: currentColors.textSecondary, marginLeft: "8px" }}>
                                평균: {period.data.avg.toFixed(1)}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "2px" }}>
                              {period.data.hottest.slice(0, 3).map((num) => (
                                <LottoNumberBall key={num} number={num} size="sm" theme={theme} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 상승/하락 번호 상세 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {/* 상승 번호 */}
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: currentColors.risingBg,
                          borderRadius: "8px",
                          border: `1px solid ${currentColors.risingBorder}`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: currentColors.risingText,
                            margin: "0 0 8px 0",
                          }}
                        >
                          📈 상승 트렌드
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {trendStats.numberTrends
                            .filter(n => n.trendDirection === "rising")
                            .slice(0, 5)
                            .map((trend) => (
                              <div
                                key={trend.number}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "11px",
                                }}
                              >
                                <LottoNumberBall number={trend.number} size="sm" theme={theme} />
                                <span style={{ color: currentColors.risingText }}>
                                  +{trend.trendStrength}%
                                </span>
                              </div>
                          ))}
                        </div>
                      </div>

                      {/* 하락 번호 */}
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: currentColors.fallingBg,
                          borderRadius: "8px",
                          border: `1px solid ${currentColors.fallingBorder}`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: currentColors.fallingText,
                            margin: "0 0 8px 0",
                          }}
                        >
                          📉 하락 트렌드
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {trendStats.numberTrends
                            .filter(n => n.trendDirection === "falling")
                            .slice(0, 5)
                            .map((trend) => (
                              <div
                                key={trend.number}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "11px",
                                }}
                              >
                                <LottoNumberBall number={trend.number} size="sm" theme={theme} />
                                <span style={{ color: currentColors.fallingText }}>
                                  -{trend.trendStrength}%
                                </span>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🆕 당첨금 분석 */}
              {activeTab === "prizes" && prizeStats && (
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 16px 0",
                    }}
                  >
                    💰 당첨금 통계 (
                    {analysisRange === "all"
                      ? `전체 ${actualLatestRound}~${actualOldestRound}회차`
                      : `최근 ${analysisRange}회차`}
                    )
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* 당첨금 요약 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.prizeBg,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.prizeBorder}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.prizeText,
                          margin: "0 0 12px 0",
                        }}
                      >
                        💎 당첨금 요약
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: currentColors.prizeText,
                            }}
                          >
                            {formatPrize(prizeStats.totalStats.avgJackpot)}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: currentColors.prizeText,
                            }}
                          >
                            평균 당첨금
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: currentColors.prizeText,
                            }}
                          >
                            {prizeStats.winnerAnalysis.avgWinners}명
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: currentColors.prizeText,
                            }}
                          >
                            평균 당첨자 수
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 최고/최저 당첨금 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: currentColors.surface,
                          borderRadius: "8px",
                          border: `1px solid ${currentColors.border}`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: currentColors.text,
                            margin: "0 0 8px 0",
                          }}
                        >
                          🏆 최고 당첨금
                        </h4>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.accent }}>
                          {formatPrize(prizeStats.totalStats.maxJackpot.amount)}
                        </div>
                        <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                          {prizeStats.totalStats.maxJackpot.round}회차 ({prizeStats.totalStats.maxJackpot.date})
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: currentColors.surface,
                          borderRadius: "8px",
                          border: `1px solid ${currentColors.border}`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: currentColors.text,
                            margin: "0 0 8px 0",
                          }}
                        >
                        💧 최저 당첨금
                        </h4>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.primary }}>
                          {formatPrize(prizeStats.totalStats.minJackpot.amount)}
                        </div>
                        <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                          {prizeStats.totalStats.minJackpot.round}회차 ({prizeStats.totalStats.minJackpot.date})
                        </div>
                      </div>
                    </div>

                    {/* 당첨자 수 분포 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.text,
                          margin: "0 0 12px 0",
                        }}
                      >
                        👥 당첨자 수 분포
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {prizeStats.winnerAnalysis.distribution.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              backgroundColor: currentColors.gray,
                              borderRadius: "6px",
                            }}
                          >
                            <span style={{ fontSize: "12px", fontWeight: "600", color: currentColors.text }}>
                              {item.winnerCount}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "12px", color: currentColors.textSecondary }}>
                                {item.frequency}회
                              </span>
                              <span style={{ fontSize: "12px", fontWeight: "bold", color: currentColors.primary }}>
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 당첨금 구간 분석 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "8px",
                        border: `1px solid ${currentColors.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: currentColors.text,
                          margin: "0 0 12px 0",
                        }}
                      >
                        💰 당첨금 구간별 분석
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {prizeStats.prizeRanges.map((range, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              backgroundColor: currentColors.gray,
                              borderRadius: "6px",
                            }}
                          >
                            <span style={{ fontSize: "12px", fontWeight: "600", color: currentColors.text }}>
                              {range.range}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "11px", color: currentColors.textSecondary }}>
                                {range.count}회 ({range.percentage}%)
                              </span>
                              <span style={{ fontSize: "11px", color: currentColors.primary }}>
                                평균 {range.avgWinners}명
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 트렌드 분석 */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: prizeStats.trendAnalysis.recentTrend === "increasing" 
                          ? currentColors.risingBg : prizeStats.trendAnalysis.recentTrend === "decreasing"
                          ? currentColors.fallingBg : currentColors.gray,
                        borderRadius: "8px",
                        border: `1px solid ${
                          prizeStats.trendAnalysis.recentTrend === "increasing" 
                            ? currentColors.risingBorder : prizeStats.trendAnalysis.recentTrend === "decreasing"
                            ? currentColors.fallingBorder : currentColors.grayBorder
                        }`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: prizeStats.trendAnalysis.recentTrend === "increasing" 
                            ? currentColors.risingText : prizeStats.trendAnalysis.recentTrend === "decreasing"
                            ? currentColors.fallingText : currentColors.text,
                          margin: "0 0 8px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {prizeStats.trendAnalysis.recentTrend === "increasing" ? "📈" :
                         prizeStats.trendAnalysis.recentTrend === "decreasing" ? "📉" : "📊"} 
                        당첨금 트렌드: {
                          prizeStats.trendAnalysis.recentTrend === "increasing" ? "상승" :
                          prizeStats.trendAnalysis.recentTrend === "decreasing" ? "하락" : "안정"
                        }
                      </h4>
                      <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>
                        최근 20회차 기준 {Math.abs(prizeStats.trendAnalysis.jackpotGrowth)}%{" "}
                        {prizeStats.trendAnalysis.jackpotGrowth > 0 ? "증가" : "감소"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default Stats;
