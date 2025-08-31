import React, { useState, useEffect } from "react";
import LottoNumberBall from "../shared/LottoNumberBall";
import {
  lottoRecommendService,
  RecommendStrategy,
} from "../../services/lottoRecommendService";

// 커스텀 팝업 컴포넌트
interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: "success" | "error" | "info";
  theme?: "light" | "dark";
}

const CustomPopup: React.FC<PopupProps> = ({ isOpen, onClose, message, type = "success", theme = "light" }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colors = {
    light: {
      overlay: "rgba(0, 0, 0, 0.5)",
      background: "#ffffff",
      text: "#1f2937",
      border: "#e5e7eb",
    },
    dark: {
      overlay: "rgba(0, 0, 0, 0.7)",
      background: "#1e293b",
      text: "#f1f5f9",
      border: "#334155",
    },
  };

  const currentColors = colors[theme];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: currentColors.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: currentColors.background,
          borderRadius: "12px",
          padding: "20px 24px",
          minWidth: "280px",
          maxWidth: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: `1px solid ${currentColors.border}`,
          animation: "slideUp 0.3s ease-out",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>
          {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
        </div>
        <div
          style={{
            fontSize: "16px",
            color: currentColors.text,
            lineHeight: "1.5",
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </div>
      </div>
      
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

interface RecommendProps {
  pastWinningNumbers: number[][];
  onAddToPurchaseHistory: (numbers: number[], strategy: string) => void;
  isDataLoading?: boolean;
  dataStatus?: any;
  roundRange?: {
    latestRound: number;
    oldestRound: number;
  };
  theme?: "light" | "dark";
  autoSave?: boolean;
}

const Recommend: React.FC<RecommendProps> = ({
  pastWinningNumbers,
  onAddToPurchaseHistory,
  isDataLoading,
  dataStatus,
  roundRange,
  theme = "light",
  autoSave = false,
}) => {
  const [activeGrade, setActiveGrade] = useState("1");
  const [recommendedStrategies, setRecommendedStrategies] = useState<
    RecommendStrategy[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [showAnalysisDetail, setShowAnalysisDetail] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // 팝업 상태 관리
  const [popup, setPopup] = useState<{ isOpen: boolean; message: string; type: "success" | "error" | "info" }>({ 
    isOpen: false, 
    message: "", 
    type: "success" 
  });

  const showPopup = (message: string, type: "success" | "error" | "info" = "success") => {
    setPopup({ isOpen: true, message, type });
  };

  const closePopup = () => {
    setPopup({ ...popup, isOpen: false });
  };

  // 동적 회차 계산
  const totalRounds = pastWinningNumbers.length;
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;

  // 색상 테마
  const colors = {
    light: {
      background: "#f9fafb",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
      gray: "#f9fafb",
      grayBorder: "#e5e7eb",
      gradientStart: "#059669",
      gradientEnd: "#0891b2",
    },
    dark: {
      background: "#0f172a",
      surface: "#1e293b",
      primary: "#3b82f6",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      accent: "#10b981",
      gray: "#334155",
      grayBorder: "#475569",
      gradientStart: "#10b981",
      gradientEnd: "#06b6d4",
    },
  };

  const currentColors = colors[theme];

  // 당첨 등급 정보
  const gradeInfo: { [key: string]: any } = {
    "1": {
      name: "1등",
      desc: "6개 번호 일치",
      probability: "1/8,145,060",
      prize: "약 20억원",
      strategy: `${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) 빅데이터 AI 완벽 분석`,
      emoji: "👑",
      color: currentColors.accent,
    },
    "2": {
      name: "2등",
      desc: "5개 번호 + 보너스 일치",
      probability: "1/1,357,510",
      prize: "약 6천만원",
      strategy: "고빈도 + 보너스 고려 다각도 분석",
      emoji: "🥈",
      color: "#0891b2",
    },
    "3": {
      name: "3등",
      desc: "5개 번호 일치",
      probability: "1/35,724",
      prize: "약 150만원",
      strategy: "균형 분석 (5개 적중 목표)",
      emoji: "🥉",
      color: "#7c3aed",
    },
    "4": {
      name: "4등",
      desc: "4개 번호 일치",
      probability: "1/733",
      prize: "5만원",
      strategy: "패턴 분석 (4개 적중 목표)",
      emoji: "🎯",
      color: "#dc2626",
    },
    "5": {
      name: "5등",
      desc: "3개 번호 일치",
      probability: "1/45",
      prize: "5천원",
      strategy: "확률 중심 (3개 적중 목표)",
      emoji: "🎲",
      color: "#ea580c",
    },
  };

  // TWA 광고 완료 이벤트 리스너
  useEffect(() => {
    const handleAdReward = (event: any) => {
      console.log("🎁 TWA 광고 시청 완료:", event.detail);
      generate1stGradeRecommendationsAfterAd();
    };

    window.addEventListener('adRewardEarned', handleAdReward);
    return () => {
      window.removeEventListener('adRewardEarned', handleAdReward);
    };
  }, []);

  // 분석 통계 로드
  useEffect(() => {
    loadAnalysisStats();
    console.log("🎯 TWA 번호추천 페이지 로드 완료");
  }, [totalRounds, roundRange]);

  const loadAnalysisStats = async () => {
    const stats = lottoRecommendService.getAnalysisStats();
    setAnalysisStats(stats);
  };

  // TWA 광고 시청 후 1등급 추천 생성
  const generate1stGradeRecommendations = async () => {
    console.log("🎯 1등 추천 버튼 클릭 - TWA 광고 시작");
    
    try {
      const windowWithAds = window as any;
      if (windowWithAds.showRewardedAd) {
        console.log("📺 TWA 광고 시작");
        await windowWithAds.showRewardedAd();
      } else {
        console.log("⚠️ 광고 시스템 없음, AI 분석 바로 시작");
        generate1stGradeRecommendationsAfterAd();
      }
    } catch (error) {
      console.error("❌ 광고 실패:", error);
      showPopup("광고를 시청할 수 없습니다.\n바로 AI 분석을 시작합니다.", "info");
      generate1stGradeRecommendationsAfterAd();
    }
  };

  // 실제 AI 분석 수행
  const generate1stGradeRecommendationsAfterAd = async () => {
    setLoading(true);
    setHasGenerated(true);

    try {
      console.log(`🧠 TWA AI 빅데이터 분석 시작: ${totalRounds}개 회차`);
      
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const strategies = await lottoRecommendService.generate1stGradeRecommendations();
      setRecommendedStrategies(strategies);

      console.log(`✅ ${strategies.length}개 AI 전략 생성 완료!`);

      // 자동저장
      if (autoSave && strategies.length > 0) {
        const bestStrategy = strategies.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        );
        onAddToPurchaseHistory(bestStrategy.numbers, bestStrategy.name);
        setTimeout(() => {
          showPopup(`자동저장 완료!\n"${bestStrategy.name}" 번호가 내번호함에 저장되었습니다.`);
        }, 500);
      }
    } catch (error) {
      console.error("❌ AI 분석 실패:", error);
      setRecommendedStrategies(generateFallbackStrategies());
    } finally {
      setLoading(false);
    }
  };

  // 2-5등급 추천 생성
  const generateBasicRecommendations = async (grade: string) => {
    setLoading(true);
    setHasGenerated(true);

    try {
      console.log(`🎯 ${gradeInfo[grade].name} 분석 시작`);
      
      await new Promise((resolve) => setTimeout(resolve, 800));

      let strategies: RecommendStrategy[] = [];
      
      switch (grade) {
        case "2":
          strategies = await lottoRecommendService.generate2ndGradeRecommendations();
          break;
        case "3":
          strategies = await lottoRecommendService.generate3rdGradeRecommendations();
          break;
        case "4":
          strategies = await lottoRecommendService.generate4thGradeRecommendations();
          break;
        case "5":
          strategies = await lottoRecommendService.generate5thGradeRecommendations();
          break;
        default:
          strategies = generateFallbackStrategies(grade);
      }

      setRecommendedStrategies(strategies);
      console.log(`✅ ${gradeInfo[grade].name} 분석 완료: ${strategies.length}개 전략`);

      if (autoSave && strategies.length > 0) {
        const bestStrategy = strategies[0];
        onAddToPurchaseHistory(bestStrategy.numbers, bestStrategy.name);
        setTimeout(() => {
          showPopup(`자동저장 완료!\n"${bestStrategy.name}" 번호가 내번호함에 저장되었습니다.`);
        }, 500);
      }
    } catch (error) {
      console.error(`❌ ${gradeInfo[grade].name} 분석 실패:`, error);
      setRecommendedStrategies(generateFallbackStrategies(grade));
    } finally {
      setLoading(false);
    }
  };

  // 폴백 전략 생성
  const generateFallbackStrategies = (grade: string = "1"): RecommendStrategy[] => {
    const strategies: RecommendStrategy[] = [];

    for (let i = 0; i < 5; i++) {
      const numbers = generateRandomNumbers();
      strategies.push({
        name: `${gradeInfo[grade].name} 전략 ${i + 1}`,
        numbers: numbers,
        grade: gradeInfo[grade].name,
        description: `${gradeInfo[grade].strategy} 방식으로 생성된 번호`,
        confidence: 70 + Math.floor(Math.random() * 20),
        analysisData: {
          dataRange: `${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개)`,
          method: "기본 분석",
          patterns: ["빈도 분석", "랜덤 조합"],
        },
      });
    }

    return strategies;
  };

  // 랜덤 번호 생성
  const generateRandomNumbers = (): number[] => {
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  // 추천 번호 생성
  const generateRecommendations = (grade: string) => {
    setRecommendedStrategies([]);
    
    if (grade === "1") {
      generate1stGradeRecommendations();
    } else {
      generateBasicRecommendations(grade);
    }
  };

  // 신뢰도 스타일
  const getConfidenceStyle = (confidence: number): { color: string; emoji: string; text: string } => {
    if (confidence >= 95) return { color: currentColors.accent, emoji: "🔥", text: "초고신뢰" };
    if (confidence >= 90) return { color: "#0891b2", emoji: "💎", text: "고신뢰" };
    if (confidence >= 85) return { color: "#7c3aed", emoji: "⭐", text: "우수" };
    if (confidence >= 80) return { color: "#dc2626", emoji: "✨", text: "양호" };
    return { color: currentColors.textSecondary, emoji: "📊", text: "기본" };
  };

  // 아이콘 래퍼
  const IconWrapper: React.FC<{ 
    children: React.ReactNode; 
    size?: "sm" | "md" | "lg";
    style?: React.CSSProperties;
  }> = ({ children, size = "md", style = {} }) => {
    const sizeMap = { sm: "16px", md: "20px", lg: "24px" };
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: sizeMap[size],
          height: sizeMap[size],
          fontSize: sizeMap[size],
          lineHeight: "1",
          textAlign: "center" as const,
          ...style,
        }}
      >
        {children}
      </span>
    );
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* 팝업 */}
      <CustomPopup
        isOpen={popup.isOpen}
        onClose={closePopup}
        message={popup.message}
        type={popup.type}
        theme={theme}
      />

      {/* TWA 빅데이터 분석 시스템 헤더 */}
      {analysisStats && (
        <div
          style={{
            background: `linear-gradient(135deg, ${currentColors.gradientStart} 0%, ${currentColors.gradientEnd} 100%)`,
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "12px",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              right: "-20%",
              width: "200px",
              height: "200px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              transform: "rotate(45deg)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  lineHeight: "1.2",
                }}
              >
                <IconWrapper>🧠</IconWrapper>
                <span>TWA AI 빅데이터 분석 시스템</span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "4px",
                    fontWeight: "600",
                    lineHeight: "1",
                  }}
                >
                  v2.1
                </span>
              </h3>

              <button
                onClick={() => setShowAnalysisDetail(!showAnalysisDetail)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {showAnalysisDetail ? "간단히" : "자세히"}
              </button>
            </div>

            <div style={{ fontSize: "14px", opacity: 0.9, lineHeight: "1.4" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">📊</IconWrapper>
                  <strong>{actualLatestRound}~{actualOldestRound}</strong>회차 분석
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">🎯</IconWrapper>
                  <strong>{(totalRounds * 6).toLocaleString()}</strong>개 패턴
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">📱</IconWrapper>
                  상태: <strong>TWA 최적화</strong>
                </span>
              </div>

              {showAnalysisDetail && (
                <div
                  style={{ 
                    marginTop: "12px", 
                    fontSize: "12px", 
                    opacity: 0.8,
                    lineHeight: "1.5" 
                  }}
                >
                  <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconWrapper size="sm">📈</IconWrapper>
                    데이터 범위: {actualLatestRound}회차 ~ {actualOldestRound}회차 (총 {totalRounds}개)
                  </div>
                  <div style={{ marginBottom: "4px", display: "flex", alignItems: "flex-start", gap: "4px" }}>
                    <IconWrapper size="sm">🔥</IconWrapper>
                    핫넘버: {analysisStats.hotNumbers?.join(", ") || "7, 27, 38, 3, 6, 9"}
                    <span style={{ margin: "0 4px" }}>|</span>
                    <IconWrapper size="sm">🧊</IconWrapper>
                    콜드넘버: {analysisStats.coldNumbers?.join(", ") || "25, 23, 32, 2, 5"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconWrapper size="sm">📱</IconWrapper>
                    환경: TWA (Trusted Web Activity) 최적화
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메인 추천 영역 */}
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
            lineHeight: "1.2",
          }}
        >
          <IconWrapper>🎯</IconWrapper>
          <span>당첨 등급별 AI 추천</span>
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: currentColors.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.4",
          }}
        >
          {activeGrade === "1"
            ? `🔥 TWA 환경에서 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) 빅데이터 AI 분석!`
            : `${gradeInfo[activeGrade].name} 맞춤 번호를 스마트하게 추천해드립니다`}
        </p>

        {/* 등급 선택 버튼들 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {Object.entries(gradeInfo).map(([grade, info]) => (
            <button
              key={grade}
              onClick={() => {
                setActiveGrade(grade);
                setRecommendedStrategies([]);
                setHasGenerated(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                textAlign: "left" as const,
                border: activeGrade === grade ? `2px solid ${info.color}` : `2px solid ${currentColors.border}`,
                backgroundColor: activeGrade === grade 
                  ? theme === "dark" ? `${info.color}20` : `${info.color}15`
                  : currentColors.surface,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: activeGrade === grade ? `0 4px 12px ${info.color}30` : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <IconWrapper>{info.emoji}</IconWrapper>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: activeGrade === grade ? info.color : currentColors.text,
                      lineHeight: "1",
                    }}
                  >
                    {info.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      backgroundColor: activeGrade === grade ? info.color : currentColors.gray,
                      color: activeGrade === grade ? "white" : currentColors.textSecondary,
                      fontWeight: "bold",
                      lineHeight: "1",
                    }}
                  >
                    {info.desc}
                  </span>
                </div>

                {grade === "1" && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "linear-gradient(45deg, #dc2626, #ea580c)",
                      color: "white",
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      lineHeight: "1",
                    }}
                  >
                    <IconWrapper size="sm">📺</IconWrapper>
                    TWA 광고 시청
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: currentColors.textSecondary,
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  lineHeight: "1.3",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">🎲</IconWrapper>
                  확률: <strong>{info.probability}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">💰</IconWrapper>
                  상금: <strong>{info.prize}</strong>
                </span>
              </div>

              <div style={{ 
                fontSize: "12px", 
                color: currentColors.textSecondary,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                lineHeight: "1.3"
              }}>
                <IconWrapper size="sm">📊</IconWrapper>
                {info.strategy}
              </div>
            </button>
          ))}
        </div>

        {/* 추천 버튼 */}
        <div style={{ textAlign: "center" as const }}>
          <button
            onClick={() => generateRecommendations(activeGrade)}
            disabled={loading}
            style={{
              background: loading
                ? currentColors.textSecondary
                : activeGrade === "1"
                ? `linear-gradient(45deg, ${currentColors.gradientStart}, ${currentColors.gradientEnd})`
                : gradeInfo[activeGrade].color,
              color: "white",
              padding: "14px 24px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              boxShadow: loading ? "none" : `0 4px 12px ${gradeInfo[activeGrade].color}40`,
              transform: loading ? "none" : "translateY(-1px)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              margin: "0 auto",
              lineHeight: "1",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff30",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span>
                  {activeGrade === "1"
                    ? "🧠 TWA AI 분석중..."
                    : `${gradeInfo[activeGrade].name} 분석중...`}
                </span>
              </>
            ) : (
              <>
                <IconWrapper>{gradeInfo[activeGrade].emoji}</IconWrapper>
                <span>
                  {activeGrade === "1"
                    ? "📺 TWA 광고 후 AI 분석!"
                    : `${gradeInfo[activeGrade].name} 추천 받기`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 추천 결과 영역 */}
      {loading ? (
        <div
          style={{
            backgroundColor: currentColors.surface,
            borderRadius: "12px",
            padding: "32px 16px",
            textAlign: "center" as const,
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: `4px solid ${currentColors.border}`,
              borderTop: `4px solid ${currentColors.accent}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />

          <h3
            style={{
              color: currentColors.text,
              margin: "0 0 8px 0",
              fontSize: "18px",
              lineHeight: "1.2",
            }}
          >
            {activeGrade === "1"
              ? `🧠 TWA AI가 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) 분석중...`
              : `${gradeInfo[activeGrade].name} 맞춤 번호를 생성중...`}
          </h3>

          {activeGrade === "1" && (
            <div style={{ fontSize: "14px", color: currentColors.accent, marginTop: "12px", lineHeight: "1.4" }}>
              <div style={{ margin: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", backgroundColor: currentColors.accent, borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                <span>전체 기간 빈도 분석 중...</span>
              </div>
              <div style={{ margin: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", backgroundColor: "#0891b2", borderRadius: "50%", animation: "pulse 1.5s infinite 0.5s" }} />
                <span>최신 트렌드 패턴 인식 중...</span>
              </div>
              <div style={{ margin: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", backgroundColor: "#7c3aed", borderRadius: "50%", animation: "pulse 1.5s infinite 1s" }} />
                <span>TWA AI 머신러닝 예측 중...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {recommendedStrategies.map((strategy, index) => {
            const confStyle = getConfidenceStyle(strategy.confidence);

            return (
              <div
                key={index}
                style={{
                  backgroundColor: currentColors.surface,
                  borderRadius: "12px",
                  padding: "16px",
                  border: strategy.confidence >= 90 ? `2px solid ${confStyle.color}` : `1px solid ${currentColors.border}`,
                  boxShadow: strategy.confidence >= 90 ? `0 4px 16px ${confStyle.color}20` : "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* 고신뢰도 배지 */}
                {strategy.confidence >= 90 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      right: "0",
                      background: `linear-gradient(45deg, ${confStyle.color}, ${confStyle.color}dd)`,
                      color: "white",
                      padding: "4px 12px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      clipPath: "polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      lineHeight: "1",
                      zIndex: 1,
                    }}
                  >
                    <IconWrapper size="sm">{confStyle.emoji}</IconWrapper>
                    {confStyle.text}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h3 style={{ fontWeight: "bold", color: currentColors.text, margin: "0", fontSize: "16px", lineHeight: "1.2" }}>
                        {strategy.name}
                      </h3>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor: confStyle.color,
                          color: "white",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          lineHeight: "1",
                        }}
                      >
                        <IconWrapper size="sm">{confStyle.emoji}</IconWrapper>
                        {strategy.confidence}%
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: currentColors.textSecondary, margin: "0 0 8px 0", lineHeight: "1.4" }}>
                      {strategy.description}
                    </p>

                    <div style={{ fontSize: "11px", color: currentColors.textSecondary, display: "flex", gap: "12px", flexWrap: "wrap", lineHeight: "1.3" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <IconWrapper size="sm">📊</IconWrapper>
                        {strategy.analysisData.dataRange}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <IconWrapper size="sm">🔍</IconWrapper>
                        {strategy.analysisData.method}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 번호 표시 */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    backgroundColor: currentColors.gray,
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    border: `2px dashed ${currentColors.grayBorder}`,
                  }}
                >
                  {strategy.numbers.map((num, i) => (
                    <LottoNumberBall key={i} number={num} size="md" theme={theme} />
                  ))}
                </div>

                {/* 내번호함 추가 버튼 */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <button
                    onClick={() => {
                      onAddToPurchaseHistory(strategy.numbers, strategy.name);
                      showPopup("내번호함에 저장되었습니다!");
                    }}
                    style={{
                      background: `linear-gradient(45deg, ${currentColors.primary}, #3b82f6)`,
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      lineHeight: "1",
                      minWidth: "120px",
                      justifyContent: "center",
                    }}
                  >
                    <IconWrapper size="sm">🗂️</IconWrapper>
                    내번호함에 추가
                  </button>
                </div>

                {/* 분석 패턴 태그들 */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", lineHeight: "1.3" }}>
                  <span style={{ fontSize: "11px", color: currentColors.textSecondary, fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconWrapper size="sm">🏷️</IconWrapper>
                    분석 패턴:
                  </span>
                  {strategy.analysisData.patterns.map((pattern, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: currentColors.gray,
                        color: currentColors.textSecondary,
                        border: `1px solid ${currentColors.grayBorder}`,
                        lineHeight: "1",
                      }}
                    >
                      {pattern}
                    </span>
                  ))}
                </div>

                {strategy.analysisData.specialInfo && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: currentColors.accent,
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      lineHeight: "1.3",
                    }}
                  >
                    <IconWrapper size="sm">✨</IconWrapper>
                    {strategy.analysisData.specialInfo}
                  </div>
                )}
              </div>
            );
          })}

          {/* 추천이 생성되지 않았을 때 */}
          {recommendedStrategies.length === 0 && !hasGenerated && (
            <div
              style={{
                textAlign: "center" as const,
                padding: "48px 16px",
                backgroundColor: currentColors.surface,
                borderRadius: "12px",
                border: `1px solid ${currentColors.border}`,
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px", display: "flex", justifyContent: "center", alignItems: "center", height: "80px" }}>
                <IconWrapper size="lg" style={{ fontSize: "64px" }}>
                  {gradeInfo[activeGrade].emoji}
                </IconWrapper>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: currentColors.text, margin: "0 0 8px 0", lineHeight: "1.2" }}>
                {gradeInfo[activeGrade].name} 추천번호
              </h3>
              <p style={{ color: currentColors.textSecondary, margin: "0 0 6px 0", fontSize: "14px", lineHeight: "1.4" }}>
                확률: {gradeInfo[activeGrade].probability}
              </p>
              <p style={{ color: currentColors.textSecondary, margin: "0 0 24px 0", fontSize: "14px", lineHeight: "1.4" }}>
                예상상금: {gradeInfo[activeGrade].prize}
              </p>
              <p style={{ color: currentColors.textSecondary, margin: "0 0 24px 0", fontSize: "13px", fontStyle: "italic", lineHeight: "1.4" }}>
                {activeGrade === "1"
                  ? "위의 버튼을 클릭하여 TWA 광고 시청 후 AI 분석을 시작하세요!"
                  : "위의 버튼을 클릭하여 AI 분석을 시작하세요!"}
              </p>
            </div>
          )}
        </div>
      )}

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

export default Recommend;
