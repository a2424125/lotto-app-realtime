import React, { useState } from "react";
import { lottoRecommendService } from "../../services/lottoRecommendService";

interface SettingsProps {
  onDataExport: () => void;
  onDataImport: (data: any) => void;
  onDataReset: () => void;
  onRefreshData?: () => void;
  onThemeChange?: (theme: "light" | "dark") => void;
  onAutoSaveChange?: (autoSave: boolean) => void;
  currentTheme?: "light" | "dark";
  currentAutoSave?: boolean;
  dataStatus?: any;
}

const Settings: React.FC<SettingsProps> = ({
  onDataExport,
  onDataImport,
  onDataReset,
  onRefreshData,
  onThemeChange,
  onAutoSaveChange,
  currentTheme = "light",
  currentAutoSave = false,
  dataStatus,
}) => {
  const [notifications, setNotifications] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  // 다크 모드 색상 테마
  const colors = {
    light: {
      background: "#f9fafb",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
      cardBg: "#f9fafb",
      successBg: "#f0f9ff",
      successBorder: "#bfdbfe",
      successText: "#1e40af",
      // 🆕 실시간 상태 색상
      realtimeBg: "#f0fdf4",
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
      cardBg: "#334155",
      successBg: "#1e293b",
      successBorder: "#475569",
      successText: "#38bdf8",
      // 🆕 실시간 상태 색상 (다크모드)
      realtimeBg: "#134e4a",
      realtimeBorder: "#047857",
      realtimeText: "#6ee7b7",
    },
  };

  const currentColors = colors[currentTheme];

  // 캐시 초기화 함수
  const handleClearCache = async () => {
    try {
      setIsClearing(true);

      // 로또 추천 서비스 캐시 클리어
      lottoRecommendService.clearCache();

      // 브라우저 캐시도 일부 클리어 (선택적)
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }

      setTimeout(() => {
        setIsClearing(false);
        alert("✅ 캐시가 성공적으로 초기화되었습니다!");
      }, 1000);
    } catch (error) {
      setIsClearing(false);
      alert("❌ 캐시 초기화 중 오류가 발생했습니다.");
      console.error("캐시 초기화 오류:", error);
    }
  };

  // 테마 토글 함수
  const handleThemeToggle = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  // 자동저장 토글 함수
  const handleAutoSaveToggle = () => {
    const newAutoSave = !currentAutoSave;
    if (onAutoSaveChange) {
      onAutoSaveChange(newAutoSave);
    }
  };

  return (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: currentColors.text,
            margin: "0 0 8px 0",
          }}
        >
          ⚙️ 설정
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: currentColors.textSecondary,
            margin: "0 0 16px 0",
          }}
        >
          실시간 로또 앱 환경설정 및 시스템 관리
        </p>
      </div>

      {/* 🆕 실시간 크롤링 상태 */}
      {dataStatus && (
        <div
          style={{
            backgroundColor: currentColors.realtimeBg,
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${currentColors.realtimeBorder}`,
            marginBottom: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: currentColors.realtimeText,
              margin: "0 0 12px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🕷️ 실시간 크롤링 시스템
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                backgroundColor: currentColors.realtimeBorder,
                color: "white",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              v2.0
            </span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* 크롤러 상태 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: currentColors.surface,
                borderRadius: "6px",
              }}
            >
              <span
                style={{ fontSize: "14px", color: currentColors.textSecondary }}
              >
                📡 크롤링 상태
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: dataStatus.isRealTime
                    ? currentColors.accent
                    : "#d97706",
                }}
              >
                {dataStatus.isRealTime ? "🟢 실시간 연동" : "🟡 오프라인"}
              </span>
            </div>

            {/* 데이터 소스 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: currentColors.surface,
                borderRadius: "6px",
              }}
            >
              <span
                style={{ fontSize: "14px", color: currentColors.textSecondary }}
              >
                🌐 데이터 소스
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: currentColors.text,
                }}
              >
                {dataStatus.crawlerInfo?.source || "Lottolyzer.com"}
              </span>
            </div>

            {/* 업데이트 주기 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: currentColors.surface,
                borderRadius: "6px",
              }}
            >
              <span
                style={{ fontSize: "14px", color: currentColors.textSecondary }}
              >
                🔄 업데이트 주기
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: currentColors.text,
                }}
              >
                {dataStatus.crawlerInfo?.updateInterval || "10분"}
              </span>
            </div>

            {/* 크롤러 헬스 */}
            {dataStatus.crawlerHealth && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: currentColors.surface,
                  borderRadius: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: currentColors.textSecondary,
                  }}
                >
                  💚 크롤러 상태
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color:
                      dataStatus.crawlerHealth === "healthy"
                        ? currentColors.accent
                        : dataStatus.crawlerHealth === "checking"
                        ? "#d97706"
                        : "#dc2626",
                  }}
                >
                  {dataStatus.crawlerHealth === "healthy"
                    ? "정상"
                    : dataStatus.crawlerHealth === "checking"
                    ? "확인중"
                    : "오류"}
                </span>
              </div>
            )}

            {/* 데이터 범위 */}
            {dataStatus.roundRange && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: currentColors.surface,
                  borderRadius: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: currentColors.textSecondary,
                  }}
                >
                  📊 데이터 범위
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: currentColors.text,
                  }}
                >
                  {dataStatus.roundRange.latestRound}~
                  {dataStatus.roundRange.oldestRound}회차
                </span>
              </div>
            )}

            {/* 마지막 업데이트 */}
            {dataStatus.lastUpdate && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: currentColors.surface,
                  borderRadius: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: currentColors.textSecondary,
                  }}
                >
                  🕐 마지막 업데이트
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: currentColors.text,
                  }}
                >
                  {dataStatus.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* 🆕 실시간 데이터 새로고침 버튼 */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                backgroundColor: currentColors.primary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              🕷️ 실시간 데이터 새로고침
            </button>
          )}
        </div>
      )}

      {/* 일반 설정 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: currentColors.text,
            margin: "0 0 12px 0",
          }}
        >
          일반 설정
        </h3>

        {/* 알림 설정 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            backgroundColor: currentColors.cardBg,
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
                margin: "0",
              }}
            >
              🔔 추첨일 알림
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.textSecondary,
                margin: "0",
              }}
            >
              매주 토요일 추첨 전 실시간 알림을 받습니다
            </p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: notifications ? "#10b981" : currentColors.border,
              position: "relative",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "2px",
                left: notifications ? "22px" : "2px",
                transition: "all 0.2s",
              }}
            />
          </button>
        </div>

        {/* 테마 설정 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            backgroundColor: currentColors.cardBg,
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
                margin: "0",
              }}
            >
              🌙 다크 모드
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.textSecondary,
                margin: "0",
              }}
            >
              어두운 테마로 눈의 피로를 줄입니다
            </p>
          </div>
          <button
            onClick={handleThemeToggle}
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor:
                currentTheme === "dark" ? "#10b981" : currentColors.border,
              position: "relative",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "2px",
                left: currentTheme === "dark" ? "22px" : "2px",
                transition: "all 0.2s",
              }}
            />
          </button>
        </div>

        {/* 자동 저장 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            backgroundColor: currentColors.cardBg,
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
                margin: "0",
              }}
            >
              💾 자동 저장
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.textSecondary,
                margin: "0",
              }}
            >
              AI 추천번호를 자동으로 내번호함에 저장
            </p>
          </div>
          <button
            onClick={handleAutoSaveToggle}
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: currentAutoSave
                ? "#10b981"
                : currentColors.border,
              position: "relative",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "2px",
                left: currentAutoSave ? "22px" : "2px",
                transition: "all 0.2s",
              }}
            />
          </button>
        </div>

        {/* 캐시 초기화 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            backgroundColor: currentColors.cardBg,
            borderRadius: "6px",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
                margin: "0",
              }}
            >
              🧹 캐시 초기화
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.textSecondary,
                margin: "0",
              }}
            >
              실시간 데이터 캐시를 초기화하여 성능을 최적화
            </p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            style={{
              padding: "8px 16px",
              backgroundColor: isClearing
                ? currentColors.textSecondary
                : "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: isClearing ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isClearing ? "초기화 중..." : "초기화"}
          </button>
        </div>
      </div>

      {/* 🆕 API 엔드포인트 정보 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: currentColors.text,
            margin: "0 0 12px 0",
          }}
        >
          🔗 API 정보
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: currentColors.cardBg,
              borderRadius: "6px",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              크롤링 엔드포인트
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: currentColors.text,
                fontFamily: "monospace",
              }}
            >
              /api/lotto-crawler
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: currentColors.cardBg,
              borderRadius: "6px",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              최신 결과 엔드포인트
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: currentColors.text,
                fontFamily: "monospace",
              }}
            >
              /api/latest-result
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: currentColors.cardBg,
              borderRadius: "6px",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              헬스체크 엔드포인트
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: currentColors.text,
                fontFamily: "monospace",
              }}
            >
              /api/health-check
            </span>
          </div>
        </div>
      </div>

      {/* 앱 정보 (업데이트됨) */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.border}`,
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: currentColors.text,
            margin: "0 0 12px 0",
          }}
        >
          📱 앱 정보
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              버전
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
              }}
            >
              2.0.0 (실시간)
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              크롤링 시스템
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
              }}
            >
              Vercel Functions
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              최종 업데이트
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
              }}
            >
              2025.07.02
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span
              style={{ fontSize: "14px", color: currentColors.textSecondary }}
            >
              개발자
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentColors.text,
              }}
            >
              hyung.j (실시간 업그레이드)
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: currentColors.successBg,
            borderRadius: "6px",
            border: `1px solid ${currentColors.successBorder}`,
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: currentColors.successText,
              margin: "0",
              textAlign: "center",
            }}
          >
            🕷️ 실시간 로또 6/45 크롤링 앱입니다! <br />
            이제 매주 수동 업데이트가 필요 없습니다. <br />
            과도한 구매는 가계에 부담이 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
