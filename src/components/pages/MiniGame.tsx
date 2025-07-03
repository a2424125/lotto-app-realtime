import React, { useState } from "react";

interface MiniGameProps {
  pastWinningNumbers: number[][];
  isDataLoading?: boolean;
  dataStatus?: any;
  roundRange?: {
    latestRound: number;
    oldestRound: number;
  };
  theme?: "light" | "dark";
}

const MiniGame: React.FC<MiniGameProps> = ({
  pastWinningNumbers,
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
}) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // ✅ 실제 회차 범위 정보 사용
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers.length;

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
    },
  };

  const currentColors = colors[theme];

  const games = [
    {
      id: "guess",
      name: "번호맞추기",
      desc: "숨겨진 번호를 맞춰보세요",
      emoji: "🎯",
      color: currentColors.primary,
    },
    {
      id: "lucky",
      name: "행운뽑기",
      desc: "오늘의 행운 번호를 뽑아보세요",
      emoji: "🍀",
      color: currentColors.accent,
    },
    {
      id: "simulation",
      name: "당첨시뮬",
      desc: "가상으로 로또를 구매해보세요",
      emoji: "🎲",
      color: "#8b5cf6",
    },
    {
      id: "quiz",
      name: "로또퀴즈",
      desc: "로또 상식을 테스트해보세요",
      emoji: "🧠",
      color: "#f59e0b",
    },
  ];

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
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: currentColors.text,
            margin: "0 0 8px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🎮 로또 미니게임
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: currentColors.textSecondary,
            margin: "0 0 8px 0",
          }}
        >
          재미있는 로또 게임으로 행운을 시험해보세요!
        </p>
        <p
          style={{
            fontSize: "12px",
            color: currentColors.accent,
            margin: "0",
            fontWeight: "500",
          }}
        >
          📊 {actualLatestRound}~{actualOldestRound}회차 ({totalRounds}개)
          데이터 기반 게임
        </p>

        {/* 데이터 상태 표시 */}
        {dataStatus && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: dataStatus.isRealTime ? currentColors.accent : "#d97706",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: dataStatus.isRealTime
                  ? currentColors.accent
                  : "#f59e0b",
              }}
            />
            {dataStatus.isRealTime ? "실시간 데이터 연동" : "오프라인 모드"}
          </div>
        )}
      </div>

      {/* 게임 목록 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "12px",
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
          🎯 게임 선택
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              disabled={isDataLoading}
              style={{
                padding: "16px",
                borderRadius: "8px",
                border:
                  selectedGame === game.id
                    ? `2px solid ${game.color}`
                    : `1px solid ${currentColors.border}`,
                backgroundColor:
                  selectedGame === game.id
                    ? theme === "dark"
                      ? `${game.color}20`
                      : `${game.color}15`
                    : currentColors.surface,
                cursor: isDataLoading ? "not-allowed" : "pointer",
                textAlign: "center",
                transition: "all 0.2s",
                boxShadow:
                  selectedGame === game.id
                    ? `0 4px 12px ${game.color}30`
                    : "0 1px 3px rgba(0,0,0,0.1)",
                opacity: isDataLoading ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                {game.emoji}
              </div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color:
                    selectedGame === game.id ? game.color : currentColors.text,
                  margin: "0 0 4px 0",
                }}
              >
                {game.name}
              </h4>
              <p
                style={{
                  fontSize: "12px",
                  color: currentColors.textSecondary,
                  margin: "0",
                }}
              >
                {game.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 게임 영역 */}
      {selectedGame ? (
        <div
          style={{
            backgroundColor: currentColors.surface,
            borderRadius: "12px",
            padding: "24px",
            border: `1px solid ${currentColors.border}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚧</div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 8px 0",
            }}
          >
            게임 준비중입니다
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: currentColors.textSecondary,
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            선택하신 "
            <strong style={{ color: currentColors.text }}>
              {games.find((g) => g.id === selectedGame)?.name}
            </strong>
            " 게임을 개발중입니다.
            <br />
            {actualLatestRound}~{actualOldestRound}회차 ({totalRounds}개)
            데이터를 활용한 재미있는 게임으로 곧 만나보실 수 있습니다! 🎉
          </p>
          <button
            onClick={() => setSelectedGame(null)}
            style={{
              backgroundColor: currentColors.primary,
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            다른 게임 선택하기
          </button>
        </div>
      ) : (
        /* 게임을 선택하지 않았을 때 */
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "32px 24px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 8px 0",
            }}
          >
            게임을 선택해주세요
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: currentColors.textSecondary,
              margin: "0 0 16px 0",
            }}
          >
            위에서 원하는 미니게임을 선택하여 즐겨보세요!
          </p>

          {/* 통계 정보 - 실제 데이터 반영 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                padding: "12px",
                backgroundColor: currentColors.info,
                borderRadius: "8px",
                border: `1px solid ${currentColors.infoBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: currentColors.infoText,
                  marginBottom: "4px",
                }}
              >
                {games.length}
              </div>
              <div style={{ fontSize: "12px", color: currentColors.infoText }}>
                게임 종류
              </div>
            </div>
            <div
              style={{
                padding: "12px",
                backgroundColor: currentColors.success,
                borderRadius: "8px",
                border: `1px solid ${currentColors.successBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: currentColors.successText,
                  marginBottom: "4px",
                }}
              >
                {totalRounds}
              </div>
              <div
                style={{ fontSize: "12px", color: currentColors.successText }}
              >
                회차 데이터
              </div>
            </div>
          </div>

          {/* 실제 회차 범위 정보 박스 */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: currentColors.warning,
              borderRadius: "8px",
              border: `1px solid ${currentColors.warningBorder}`,
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: currentColors.warningText,
                margin: "0 0 6px 0",
              }}
            >
              📊 분석 데이터 범위
            </h4>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                color: currentColors.warningText,
              }}
            >
              <span>
                최신 회차: <strong>{actualLatestRound}회</strong>
              </span>
              <span>
                가장 오래된 회차: <strong>{actualOldestRound}회</strong>
              </span>
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "11px",
                color: currentColors.warningText,
                textAlign: "center",
                opacity: 0.9,
              }}
            >
              총 <strong>{totalRounds}개</strong> 회차 데이터 보유
            </div>
          </div>

          {/* 게임 개발 예정 알림 */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: currentColors.gray,
              borderRadius: "8px",
              border: `1px solid ${currentColors.grayBorder}`,
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: currentColors.textSecondary,
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              🚀{" "}
              <strong style={{ color: currentColors.text }}>
                개발 예정 기능
              </strong>
              <br />• 실제 {actualLatestRound}~{actualOldestRound}회차 데이터
              기반 게임
              <br />
              • 확률 시뮬레이션 및 패턴 학습 게임
              <br />• 재미있는 인터랙티브 경험 제공
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGame;
