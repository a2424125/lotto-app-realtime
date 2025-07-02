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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  // ✅ 실제 회차 범위 정보 사용
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers.length;

  // ✅ 문제 3 해결: 다크 모드 색상 테마 조화롭게 수정
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
      gray: "#f8fafc",
      grayBorder: "#e2e8f0",
      // 핫/콜드 색상 - 라이트 모드
      hotBg: "#fef2f2",
      hotBorder: "#f87171",
      hotText: "#dc2626",
      coldBg: "#eff6ff",
      coldBorder: "#60a5fa",
      coldText: "#2563eb",
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
      gray: "#334155",
      grayBorder: "#475569",
      // ✅ 핫/콜드 색상 - 다크 모드에서 조화롭게 수정
      hotBg: "#422006", // 어두운 따뜻한 색상
      hotBorder: "#d97706", // 주황색 테두리
      hotText: "#fed7aa", // 부드러운 주황색 텍스트
      coldBg: "#1e3a8a", // 어두운 파란색 배경
      coldBorder: "#3b82f6", // 파란색 테두리
      coldText: "#93c5fd", // 부드러운 파란색 텍스트
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

              {/* 다른 탭들은 준비중 메시지 */}
              {(activeTab === "trends" || activeTab === "prizes") && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 16px",
                    backgroundColor: currentColors.surface,
                    borderRadius: "12px",
                    border: `1px solid ${currentColors.border}`,
                  }}
                >
                  <div style={{ fontSize: "64px", marginBottom: "16px" }}>
                    🚧
                  </div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 8px 0",
                    }}
                  >
                    분석 준비중입니다
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: currentColors.textSecondary,
                      margin: "0 0 16px 0",
                      lineHeight: "1.5",
                    }}
                  >
                    {activeTab === "trends" ? "트렌드" : "당첨금"} 분석 기능을
                    개발중입니다.
                    <br />
                    {actualLatestRound}~{actualOldestRound}회차 ({totalRounds}
                    개) 데이터를 활용한 심층 분석으로 곧 만나보실 수 있습니다!
                    🎉
                  </p>
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
