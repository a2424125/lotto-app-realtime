import React, { useState, useEffect } from "react";
import LottoNumberBall from "../shared/LottoNumberBall";
import { lottoDataManager } from "../../services/lottoDataManager";
import { LottoDrawResult } from "../../types/lotto";

interface DashboardProps {
  pastWinningNumbers: number[][];
  onMenuChange: (menu: string) => void;
  generate1stGradeNumbers: () => number[];
  onRefreshData?: () => void;
  isDataLoading?: boolean;
  dataStatus?: any;
  roundRange?: {
    latestRound: number;
    oldestRound: number;
  };
  theme?: "light" | "dark";
  nextDrawInfo?: {
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
    isToday: boolean;
    timeUntilDraw: string;
    hasDrawPassed: boolean;
  } | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  pastWinningNumbers,
  onMenuChange,
  generate1stGradeNumbers,
  onRefreshData,
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
  nextDrawInfo: propNextDrawInfo
}) => {
  const totalRounds = pastWinningNumbers.length;
  const actualLatestRound = roundRange?.latestRound || 1179;
  const actualOldestRound = roundRange?.oldestRound || Math.max(1, actualLatestRound - totalRounds + 1);

  const [latestResult, setLatestResult] = useState<LottoDrawResult | null>(null);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

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
      gray: "#f9fafb",
      realtime: "#f0fdf4",
      realtimeBorder: "#bbf7d0",
      realtimeText: "#166534",
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
      gray: "#334155",
      realtime: "#134e4a",
      realtimeBorder: "#047857",
      realtimeText: "#6ee7b7",
    },
  };

  const currentColors = colors[theme];

  // 🔧 안전한 데이터 로드 (무한루프 방지)
  useEffect(() => {
    const now = Date.now();
    // 최소 10초 간격으로만 로드
    if (pastWinningNumbers.length > 0 && (now - lastLoadTime) > 10000) {
      loadLatestResultSafe();
    }
  }, [pastWinningNumbers]);

  const loadLatestResultSafe = async () => {
    // 이미 로딩 중이거나 최근에 로드했으면 스킵
    if (isLoadingLatest || loadAttempts >= 3) {
      return;
    }

    const now = Date.now();
    if (now - lastLoadTime < 10000) { // 10초 이내면 스킵
      return;
    }

    try {
      setIsLoadingLatest(true);
      setLoadAttempts(prev => prev + 1);
      setLastLoadTime(now);

      // 1순위: pastWinningNumbers 사용 (가장 안전)
      if (pastWinningNumbers.length > 0 && pastWinningNumbers[0].length >= 7) {
        const safeResult: LottoDrawResult = {
          round: actualLatestRound,
          date: new Date().toISOString().split('T')[0],
          numbers: pastWinningNumbers[0].slice(0, 6),
          bonusNumber: pastWinningNumbers[0][6],
          crawledAt: new Date().toISOString(),
          source: "safe_primary",
        };
        setLatestResult(safeResult);
        return;
      }

      // 2순위: fallback 데이터
      const fallbackResult: LottoDrawResult = {
        round: actualLatestRound,
        date: new Date().toISOString().split('T')[0],
        numbers: [3, 16, 18, 24, 40, 44],
        bonusNumber: 21,
        crawledAt: new Date().toISOString(),
        source: "safe_fallback",
      };
      setLatestResult(fallbackResult);

    } catch (error) {
      console.error("❌ 안전한 로드 실패:", error);
    } finally {
      setIsLoadingLatest(false);
    }
  };

  const handleRefreshSafe = async () => {
    if (isLoadingLatest) return;

    try {
      setIsLoadingLatest(true);
      
      if (onRefreshData) {
        await onRefreshData();
      }
      
      // 로드 제한 리셋
      setLoadAttempts(0);
      setLastLoadTime(0);
      
      await loadLatestResultSafe();
      
      alert("✅ 새로고침 완료!");
    } catch (error) {
      console.error("❌ 새로고침 실패:", error);
      alert("❌ 새로고침 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingLatest(false);
    }
  };

  const formatKoreanDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday}) 오후 8시 35분`;
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

  // 안전한 당첨번호 표시
  const getDisplayNumbers = (): { numbers: number[]; bonusNumber: number; round: number } => {
    if (pastWinningNumbers.length > 0 && pastWinningNumbers[0].length >= 7) {
      return {
        numbers: pastWinningNumbers[0].slice(0, 6),
        bonusNumber: pastWinningNumbers[0][6],
        round: actualLatestRound
      };
    }

    if (latestResult && latestResult.numbers && latestResult.bonusNumber) {
      return {
        numbers: latestResult.numbers,
        bonusNumber: latestResult.bonusNumber,
        round: latestResult.round
      };
    }

    return {
      numbers: [3, 16, 18, 24, 40, 44],
      bonusNumber: 21,
      round: actualLatestRound
    };
  };

  const displayData = getDisplayNumbers();

  return (
    <div style={{ padding: "12px" }}>
      {/* 실시간 상태 표시 */}
      <div
        style={{
          backgroundColor: currentColors.realtime,
          padding: "12px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.realtimeBorder}`,
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: dataStatus?.isRealTime ? "#10b981" : "#f59e0b",
              animation: isDataLoading ? "pulse 2s infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: currentColors.realtimeText,
            }}
          >
            {dataStatus?.isRealTime ? "🟢 실시간 연동" : "🟡 오프라인 모드"}
          </span>
        </div>
        <div
          style={{
            fontSize: "10px",
            color: currentColors.realtimeText,
            opacity: 0.8,
          }}
        >
          데이터: {totalRounds.toLocaleString()}개 회차
        </div>
      </div>

      {/* 다음 추첨 정보 */}
      <div
        style={{
          backgroundColor: currentColors.success,
          padding: "12px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.successBorder}`,
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        {propNextDrawInfo ? (
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: currentColors.successText,
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              다음 추첨: {propNextDrawInfo.round}회
              {propNextDrawInfo.isToday && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    borderRadius: "4px",
                    animation: "pulse 2s infinite",
                  }}
                >
                  오늘!
                </span>
              )}
            </h3>
            <p
              style={{
                color: currentColors.successText,
                margin: "2px 0",
                fontSize: "14px",
              }}
            >
              {formatKoreanDate(new Date(propNextDrawInfo.date))}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.successText,
                margin: "2px 0",
              }}
            >
              예상 1등 당첨금: {formatPrize(propNextDrawInfo.estimatedJackpot)}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: currentColors.successText,
                margin: "4px 0 0 0",
                fontWeight: "bold",
              }}
            >
              ⏰ {propNextDrawInfo.timeUntilDraw}
            </p>
          </div>
        ) : (
          <div style={{ padding: "16px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                border: `2px solid ${currentColors.successBorder}`,
                borderTop: `2px solid ${currentColors.successText}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 8px",
              }}
            />
            <p
              style={{
                color: currentColors.successText,
                margin: "0",
                fontSize: "12px",
              }}
            >
              다음 추첨 정보 로딩 중...
            </p>
          </div>
        )}
      </div>

      {/* 최신 당첨결과 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {displayData.round}회 당첨결과
            {isLoadingLatest && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  opacity: 0.7,
                }}
              >
                ⏳
              </span>
            )}
           </h2>
        </div>

        {/* 당첨번호 표시 */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "12px",
              color: currentColors.textSecondary,
              margin: "0 0 8px 0",
            }}
          >
            당첨번호
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            {displayData.numbers.length > 0 ? (
              <>
                {displayData.numbers.map((num, i) => (
                  <LottoNumberBall key={i} number={num} size="md" theme={theme} />
                ))}
                <span
                  style={{
                    fontSize: "16px",
                    color: currentColors.textSecondary,
                    margin: "0 4px",
                  }}
                >
                  +
                </span>
                {displayData.bonusNumber > 0 && (
                  <LottoNumberBall
                    number={displayData.bonusNumber}
                    isBonus={true}
                    size="md"
                    theme={theme}
                  />
                )}
              </>
            ) : (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: currentColors.gray,
                      border: `2px dashed ${currentColors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      color: currentColors.textSecondary,
                    }}
                  >
                    ?
                  </div>
                ))}
                <span
                  style={{
                    fontSize: "16px",
                    color: currentColors.textSecondary,
                    margin: "0 4px",
                  }}
                >
                  +
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: currentColors.gray,
                    border: `2px dashed ${currentColors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: currentColors.textSecondary,
                  }}
                >
                  ?
                </div>
              </>
            )}
          </div>
          <p
            style={{
              fontSize: "10px",
              color: currentColors.textSecondary,
              margin: "6px 0 0 0",
            }}
          >
            마지막 번호는 보너스 번호입니다
          </p>
        </div>
      </div>

      {/* AI 추천 미리보기 */}
      <div
        style={{
          backgroundColor: currentColors.info,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.infoBorder}`,
          marginBottom: "12px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: currentColors.infoText,
              margin: "0 0 6px 0",
            }}
          >
            🧠 AI 전체 회차 분석
          </h3>
          <p
            style={{
              color: currentColors.infoText,
              fontSize: "12px",
              margin: "0 0 12px 0",
            }}
          >
            확률: 1/8,145,060 | 상금: 약 20억원
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "4px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {generate1stGradeNumbers().map((num, i) => (
            <LottoNumberBall key={i} number={num} size="sm" theme={theme} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <p
            style={{
              fontSize: "12px",
              color: currentColors.infoText,
              margin: "0",
              lineHeight: "1.4",
            }}
          >
            🕷️ 전체 1~{actualLatestRound}회차 ({totalRounds.toLocaleString()}개) 데이터를 분석한 추천번호입니다
          </p>
        </div>
        <button
          onClick={() => onMenuChange("recommend")}
          style={{
            width: "100%",
            backgroundColor: currentColors.primary,
            color: "white",
            padding: "10px 0",
            borderRadius: "6px",
            border: "none",
            fontWeight: "500",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          모든 등급별 추천번호 보기
        </button>
      </div>

      {/* 메뉴 버튼들 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={() => onMenuChange("recommend")}
          style={{
            backgroundColor: currentColors.surface,
            border: `1px solid ${currentColors.border}`,
            padding: "16px 8px",
            borderRadius: "8px",
            cursor: "pointer",
            textAlign: "center",
            color: currentColors.text,
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "4px" }}>🎯</div>
          <p
            style={{
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0",
              fontSize: "14px",
            }}
          >
            번호추천
          </p>
          <p
            style={{
              fontSize: "12px",
              color: currentColors.textSecondary,
              margin: "2px 0 0 0",
            }}
          >
            AI 분석
          </p>
        </button>

        <button
          onClick={() => onMenuChange("minigame")}
          style={{
            backgroundColor: currentColors.surface,
            border: `1px solid ${currentColors.border}`,
            padding: "16px 8px",
            borderRadius: "8px",
            cursor: "pointer",
            textAlign: "center",
            color: currentColors.text,
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "4px" }}>🎮</div>
          <p
            style={{
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0",
              fontSize: "14px",
            }}
          >
            미니게임
          </p>
          <p
            style={{
              fontSize: "12px",
              color: currentColors.textSecondary,
              margin: "2px 0 0 0",
            }}
          >
            재미있는 게임
          </p>
        </button>
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

export default Dashboard;
