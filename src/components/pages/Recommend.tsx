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
      }, 2000); // 2초 후 자동 닫기
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
      success: "#059669",
    },
    dark: {
      overlay: "rgba(0, 0, 0, 0.7)",
      background: "#1e293b",
      text: "#f1f5f9",
      border: "#334155",
      success: "#10b981",
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

  // 동적 회차 계산 - 실제 데이터 기반
  const totalRounds = pastWinningNumbers.length;
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;

  // 완전한 다크 모드 색상 테마 - 모든 속성 포함 (통일된 버전)
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
      gradientStart: "#10b981",
      gradientEnd: "#06b6d4",
    },
  };

  const currentColors = colors[theme];

  // 당첨 등급별 정보 - 동적 회차 적용
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

  // 등급별 전략 정의
  const gradeStrategies: { [key: string]: Array<{ name: string; description: string; patterns: string[]; method: string }> } = {
    "2": [
      {
        name: "보너스볼 핫넘버 전략",
        description: "최근 10회차 보너스볼 출현 패턴과 고빈도 번호를 조합한 2등 특화 전략",
        patterns: ["보너스볼 빈도", "최근 10회 분석", "핫넘버 조합"],
        method: "보너스볼 특화 분석"
      },
      {
        name: "준당첨 패턴 분석",
        description: "역대 2등 당첨번호와 1등의 차이를 분석하여 보너스볼 예측 강화",
        patterns: ["2등 당첨 패턴", "보너스볼 예측", "차집합 분석"],
        method: "준당첨 통계 분석"
      },
      {
        name: "고빈도 5+1 조합",
        description: "최근 30회차 고빈도 5개 번호와 보너스볼 후보군을 결합한 전략",
        patterns: ["고빈도 5개", "보너스 후보군", "30회차 분석"],
        method: "5+1 최적화"
      },
      {
        name: "보너스볼 주기 분석",
        description: "보너스볼의 출현 주기를 분석하여 다음 보너스볼 예측에 중점",
        patterns: ["주기성 분석", "보너스 예측", "순환 패턴"],
        method: "주기 예측 모델"
      },
      {
        name: "2등 확률 극대화",
        description: "1등보다 2등 확률을 극대화하는 번호 조합 전략",
        patterns: ["2등 확률 우선", "보너스 강화", "밸런스 조정"],
        method: "확률 최적화"
      }
    ],
    "3": [
      {
        name: "균형잡힌 번호 조합",
        description: "홀짝, 고저, 구간별 균형을 맞춘 5개 적중 목표 전략",
        patterns: ["홀짝 균형", "고저 균형", "구간 분산"],
        method: "균형 분석"
      },
      {
        name: "중간값 집중 전략",
        description: "통계적으로 5개 적중 확률이 높은 중간 범위 번호 집중 선택",
        patterns: ["중간값 선호", "15-35 구간", "통계 기반"],
        method: "중간값 분석"
      },
      {
        name: "최근 트렌드 반영",
        description: "최근 20회차의 당첨 트렌드를 반영한 5개 맞추기 전략",
        patterns: ["20회차 트렌드", "최신 패턴", "동향 분석"],
        method: "트렌드 추적"
      },
      {
        name: "구간별 안정 조합",
        description: "각 10번대 구간에서 안정적으로 선택하여 5개 적중 확률 향상",
        patterns: ["구간별 선택", "안정성 우선", "분산 투자"],
        method: "구간 분석"
      },
      {
        name: "3등 빈출 패턴",
        description: "역대 3등 당첨번호의 공통 패턴을 분석한 전략",
        patterns: ["3등 패턴", "빈출 조합", "역대 분석"],
        method: "3등 특화"
      }
    ],
    "4": [
      {
        name: "4연속 패턴 포착",
        description: "연속된 4개 번호가 나올 확률을 계산한 패턴 전략",
        patterns: ["연속 번호", "4개 패턴", "연번 분석"],
        method: "연속성 분석"
      },
      {
        name: "핫콜드 믹스",
        description: "핫넘버 2개와 콜드넘버 2개를 섞어 4개 적중 확률 향상",
        patterns: ["핫넘버 2개", "콜드넘버 2개", "믹스 전략"],
        method: "핫콜드 조합"
      },
      {
        name: "쿼드 섹터 분석",
        description: "45개 번호를 4구간으로 나누어 각 구간에서 선택하는 전략",
        patterns: ["4구간 분할", "섹터별 선택", "구간 균등"],
        method: "섹터 분석"
      },
      {
        name: "4등 최다 조합",
        description: "역대 4등 당첨에서 가장 많이 나온 번호 조합 패턴",
        patterns: ["4등 최다", "빈출 4개조", "통계 우선"],
        method: "4등 통계"
      },
      {
        name: "반복 주기 포착",
        description: "4개 번호가 함께 나오는 반복 주기를 분석한 전략",
        patterns: ["반복 주기", "4개 세트", "주기성"],
        method: "주기 분석"
      }
    ],
    "5": [
      {
        name: "기본 확률 전략",
        description: "순수 확률론에 기반한 3개 번호 적중 전략",
        patterns: ["순수 확률", "랜덤성", "기본 전략"],
        method: "확률론"
      },
      {
        name: "인기번호 3종",
        description: "가장 인기있는 번호 3개를 포함한 조합 전략",
        patterns: ["인기번호", "TOP3 포함", "대중 선택"],
        method: "인기도 분석"
      },
      {
        name: "미니 조합 전략",
        description: "작은 범위에서 3개를 집중 선택하는 미니멀 전략",
        patterns: ["집중 선택", "좁은 범위", "미니 조합"],
        method: "집중 전략"
      },
      {
        name: "행운의 트리플",
        description: "통계적으로 함께 자주 나오는 3개 번호 조합",
        patterns: ["트리플 조합", "동반 출현", "행운 번호"],
        method: "동반 분석"
      },
      {
        name: "5천원의 행복",
        description: "부담없이 즐기는 3개 맞추기 기본 전략",
        patterns: ["기본 전략", "부담 없음", "즐거운 로또"],
        method: "기본 분석"
      }
    ]
  };

  // 컴포넌트 마운트 시 분석 통계만 로드 (자동 추천 제거)
  useEffect(() => {
    loadAnalysisStats();
    console.log("🎯 번호추천 페이지 로드 완료 - 수동 추천 대기 중");
  }, [totalRounds, roundRange]);

  const loadAnalysisStats = async () => {
    const stats = lottoRecommendService.getAnalysisStats();
    setAnalysisStats(stats);
    console.log(
      `📊 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) 빅데이터 분석 통계:`,
      stats
    );
  };

  // 1등급 고도화 추천번호 생성
  const generate1stGradeRecommendations = async () => {
    setLoading(true);
    setHasGenerated(true);

    try {
      console.log(
        `🧠 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) AI 빅데이터 분석 시작...`
      );

      // 로딩 애니메이션을 위한 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const strategies =
        await lottoRecommendService.generate1stGradeRecommendations();
      setRecommendedStrategies(strategies);

      console.log(`✅ ${strategies.length}개 AI 전략 생성 완료!`);

      // 자동저장 기능 구현
      if (autoSave && strategies.length > 0) {
        // 가장 신뢰도 높은 전략 자동 저장
        const bestStrategy = strategies.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        );

        onAddToPurchaseHistory(bestStrategy.numbers, bestStrategy.name);

        // 자동저장 알림 - 커스텀 팝업 사용
        setTimeout(() => {
          showPopup(`자동저장 완료!\n"${bestStrategy.name}" 번호가 내번호함에 저장되었습니다.`);
        }, 500);
      }

      // 각 전략의 신뢰도 로그
      strategies.forEach((s) => {
        console.log(`🎯 ${s.name}: 신뢰도 ${s.confidence}%`);
      });
    } catch (error) {
      console.error("❌ AI 추천 생성 실패:", error);
      setRecommendedStrategies(generateFallbackStrategies());
    } finally {
      setLoading(false);
    }
  };

  // 개선된 기본 추천 생성 (2-5등급용) - 실제 데이터 분석
  const generateBasicRecommendations = async (grade: string) => {
    setLoading(true);
    setHasGenerated(true);

    try {
      console.log(`🎯 ${gradeInfo[grade].name} 데이터 분석 시작...`);

      // 로딩 애니메이션을 위한 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 800));

      let strategies: RecommendStrategy[] = [];

      // 각 등급별 실제 데이터 분석 메서드 호출
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
          strategies = generateGradeSpecificStrategies(grade);
      }

      setRecommendedStrategies(strategies);

      console.log(`✅ ${gradeInfo[grade].name} 분석 완료! ${strategies.length}개 전략 생성`);

      // 자동저장 기능 구현 (2-5등급도 적용)
      if (autoSave && strategies.length > 0) {
        const bestStrategy = strategies[0]; // 첫 번째 전략 저장
        onAddToPurchaseHistory(bestStrategy.numbers, bestStrategy.name);

        setTimeout(() => {
          showPopup(`자동저장 완료!\n"${bestStrategy.name}" 번호가 내번호함에 저장되었습니다.`);
        }, 500);
      }

      setLoading(false);
    } catch (error) {
      console.error(`❌ ${gradeInfo[grade].name} 분석 실패:`, error);
      setRecommendedStrategies(generateGradeSpecificStrategies(grade));
      setLoading(false);
    }
  };

  // 등급별 특화 전략 생성 (fallback용)
  const generateGradeSpecificStrategies = (grade: string): RecommendStrategy[] => {
    const strategies: RecommendStrategy[] = [];
    const gradeSpecificStrategies = gradeStrategies[grade] || [];

    gradeSpecificStrategies.forEach((strategyInfo, index) => {
      const numbers = generateSmartNumbers(grade, strategyInfo.method);
      
      // 신뢰도는 등급과 전략에 따라 다르게 설정
      let confidence = 0;
      switch(grade) {
        case "2":
          confidence = 75 + Math.floor(Math.random() * 15); // 75-89
          break;
        case "3":
          confidence = 70 + Math.floor(Math.random() * 15); // 70-84
          break;
        case "4":
          confidence = 65 + Math.floor(Math.random() * 15); // 65-79
          break;
        case "5":
          confidence = 60 + Math.floor(Math.random() * 15); // 60-74
          break;
        default:
          confidence = 70 + Math.floor(Math.random() * 10);
      }

      strategies.push({
        name: strategyInfo.name,
        numbers: numbers,
        grade: gradeInfo[grade].name,
        description: strategyInfo.description,
        confidence: confidence,
        analysisData: {
          dataRange: `${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개)`,
          method: strategyInfo.method,
          patterns: strategyInfo.patterns,
          specialInfo: index === 0 ? "⭐ 추천 전략" : undefined
        },
      });
    });

    return strategies;
  };

  // 전략에 따른 스마트 번호 생성
  const generateSmartNumbers = (grade: string, method: string): number[] => {
    const numbers = new Set<number>();
    
    // 기본적으로 랜덤하게 생성하되, 메서드에 따라 약간의 변화를 줌
    switch(method) {
      case "보너스볼 특화 분석":
      case "5+1 최적화":
        // 고빈도 번호 위주로 선택 (예시)
        const hotNumbers = [3, 6, 7, 9, 27, 38];
        hotNumbers.forEach(num => {
          if (numbers.size < 3 && Math.random() > 0.5) {
            numbers.add(num);
          }
        });
        break;
        
      case "균형 분석":
        // 홀짝 균형 맞추기
        let oddCount = 0;
        let evenCount = 0;
        while (numbers.size < 6) {
          const num = Math.floor(Math.random() * 45) + 1;
          if (num % 2 === 0 && evenCount < 3) {
            numbers.add(num);
            evenCount++;
          } else if (num % 2 === 1 && oddCount < 3) {
            numbers.add(num);
            oddCount++;
          }
        }
        break;
        
      case "중간값 분석":
        // 15-35 구간 집중
        while (numbers.size < 6) {
          const num = Math.floor(Math.random() * 21) + 15; // 15-35
          numbers.add(num);
        }
        break;
        
      case "핫콜드 조합":
        // 핫넘버와 콜드넘버 믹스
        const hotNums = [3, 6, 7, 9, 27];
        const coldNums = [2, 5, 23, 25, 32];
        // 핫넘버 2개
        let hotAdded = 0;
        while (hotAdded < 2 && numbers.size < 6) {
          const idx = Math.floor(Math.random() * hotNums.length);
          if (numbers.add(hotNums[idx])) {
            hotAdded++;
          }
        }
        // 콜드넘버 2개
        let coldAdded = 0;
        while (coldAdded < 2 && numbers.size < 6) {
          const idx = Math.floor(Math.random() * coldNums.length);
          if (numbers.add(coldNums[idx])) {
            coldAdded++;
          }
        }
        break;
    }
    
    // 나머지는 랜덤으로 채우기
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    
    return Array.from(numbers).sort((a, b) => a - b);
  };

  // 폴백 전략 생성 (1등급용)
  const generateFallbackStrategies = (
    grade: string = "1"
  ): RecommendStrategy[] => {
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
    // 기존 추천 결과 초기화
    setRecommendedStrategies([]);

    if (grade === "1") {
      generate1stGradeRecommendations();
    } else {
      generateBasicRecommendations(grade);
    }
  };

  // 신뢰도에 따른 색상 및 이모지
  const getConfidenceStyle = (
    confidence: number
  ): { color: string; emoji: string; text: string } => {
    if (confidence >= 95)
      return { color: currentColors.accent, emoji: "🔥", text: "초고신뢰" };
    if (confidence >= 90)
      return { color: "#0891b2", emoji: "💎", text: "고신뢰" };
    if (confidence >= 85)
      return { color: "#7c3aed", emoji: "⭐", text: "우수" };
    if (confidence >= 80)
      return { color: "#dc2626", emoji: "✨", text: "양호" };
    return { color: currentColors.textSecondary, emoji: "📊", text: "기본" };
  };

  // 🎯 아이콘 래퍼 컴포넌트 - 일정한 크기 보장
  const IconWrapper: React.FC<{ 
    children: React.ReactNode; 
    size?: "sm" | "md" | "lg";
    style?: React.CSSProperties;
  }> = ({ 
    children, 
    size = "md",
    style = {}
  }) => {
    const sizeMap = {
      sm: "16px",
      md: "20px", 
      lg: "24px"
    };

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
          ...style, // 추가 스타일 병합
        }}
      >
        {children}
      </span>
    );
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* 커스텀 팝업 */}
      <CustomPopup
        isOpen={popup.isOpen}
        onClose={closePopup}
        message={popup.message}
        type={popup.type}
        theme={theme}
      />

      {/* 빅데이터 분석 시스템 헤더 - 실제 회차 범위 표시 */}
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
          {/* 배경 패턴 */}
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
                <span>AI 빅데이터 분석 시스템</span>
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
                  v2.0
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
                  lineHeight: "1",
                  minWidth: "48px",
                  textAlign: "center" as const,
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
                  <strong>
                    {actualLatestRound}~{actualOldestRound}
                  </strong>
                  회차 분석
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">🎯</IconWrapper>
                  <strong>{(totalRounds * 6).toLocaleString()}</strong>개 패턴
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconWrapper size="sm">🔥</IconWrapper>
                  상태:{" "}
                  <strong>
                    {analysisStats.analysisReady ? "준비완료" : "로딩중"}
                  </strong>
                </span>
                {autoSave && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 6px",
                      backgroundColor: "rgba(255,255,255,0.3)",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      lineHeight: "1",
                    }}
                  >
                    <IconWrapper size="sm">💾</IconWrapper>
                    자동저장 활성
                  </span>
                )}
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
                  <div style={{ 
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <IconWrapper size="sm">📈</IconWrapper>
                    데이터 범위: {actualLatestRound}회차 ~ {actualOldestRound}회차 (총 {totalRounds}개)
                  </div>
                  <div style={{ 
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "4px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconWrapper size="sm">🔥</IconWrapper>
                      핫넘버: {analysisStats.hotNumbers?.join(", ") || "7, 27, 38, 3, 6, 9"}
                    </div>
                    <span style={{ margin: "0 4px" }}>|</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconWrapper size="sm">🧊</IconWrapper>
                      콜드넘버: {analysisStats.coldNumbers?.join(", ") || "25, 23, 32, 2, 5"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconWrapper size="sm">📊</IconWrapper>
                    분석 기준: 최근 50회차 분석 기준
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
            ? `🔥 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) 빅데이터 AI 분석으로 최강의 1등 번호를 받아보세요!`
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
                // 등급 변경 시 추천 결과 초기화
                setRecommendedStrategies([]);
                setHasGenerated(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                textAlign: "left" as const,
                border:
                  activeGrade === grade
                    ? `2px solid ${info.color}`
                    : `2px solid ${currentColors.border}`,
                backgroundColor:
                  activeGrade === grade
                    ? theme === "dark"
                      ? `${info.color}20`
                      : `${info.color}15`
                    : currentColors.surface,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow:
                  activeGrade === grade ? `0 4px 12px ${info.color}30` : "none",
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
                <div
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    flexWrap: "wrap" 
                  }}
                >
                  <IconWrapper>{info.emoji}</IconWrapper>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color:
                        activeGrade === grade ? info.color : currentColors.text,
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
                      backgroundColor:
                        activeGrade === grade ? info.color : currentColors.gray,
                      color:
                        activeGrade === grade
                          ? "white"
                          : currentColors.textSecondary,
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
                      background: "linear-gradient(45deg, #fbbf24, #f59e0b)",
                      color: "white",
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(245, 158, 11, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      lineHeight: "1",
                    }}
                  >
                    <IconWrapper size="sm">🧠</IconWrapper>
                    AI 분석
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

        {/* 추천 버튼 - 항상 표시 */}
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
              boxShadow: loading
                ? "none"
                : `0 4px 12px ${gradeInfo[activeGrade].color}40`,
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
                    ? "🧠 AI 빅데이터 분석중..."
                    : `${gradeInfo[activeGrade].name} 분석중...`}
                </span>
              </>
            ) : (
              <>
                <IconWrapper>{gradeInfo[activeGrade].emoji}</IconWrapper>
                <span>
                  {activeGrade === "1"
                    ? "AI 빅데이터 분석 시작!"
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
              ? `🧠 AI가 ${actualLatestRound}~${actualOldestRound}회차 (${totalRounds}개) 빅데이터를 분석중입니다...`
              : `${gradeInfo[activeGrade].name} 맞춤 번호를 생성중입니다...`}
          </h3>

          {activeGrade === "1" && (
            <div
              style={{
                fontSize: "14px",
                color: currentColors.accent,
                marginTop: "12px",
                lineHeight: "1.4",
              }}
            >
              <div
                style={{
                  margin: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: currentColors.accent,
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <span>전체 기간 빈도 분석 중...</span>
              </div>
              <div
                style={{
                  margin: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#0891b2",
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite 0.5s",
                  }}
                />
                <span>최신 트렌드 패턴 인식 중...</span>
              </div>
              <div
                style={{
                  margin: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#7c3aed",
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite 1s",
                  }}
                />
                <span>AI 머신러닝 예측 중...</span>
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
                  border:
                    strategy.confidence >= 90
                      ? `2px solid ${confStyle.color}`
                      : `1px solid ${currentColors.border}`,
                  boxShadow:
                    strategy.confidence >= 90
                      ? `0 4px 16px ${confStyle.color}20`
                      : "0 2px 8px rgba(0,0,0,0.1)",
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
                      clipPath:
                        "polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)",
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          fontWeight: "bold",
                          color: currentColors.text,
                          margin: "0",
                          fontSize: "16px",
                          lineHeight: "1.2",
                        }}
                      >
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

                    <p
                      style={{
                        fontSize: "13px",
                        color: currentColors.textSecondary,
                        margin: "0 0 8px 0",
                        lineHeight: "1.4",
                      }}
                    >
                      {strategy.description}
                    </p>

                    <div
                      style={{
                        fontSize: "11px",
                        color: currentColors.textSecondary,
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        lineHeight: "1.3",
                      }}
                    >
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
                    <LottoNumberBall
                      key={i}
                      number={num}
                      size="md"
                      theme={theme}
                    />
                  ))}
                </div>

                {/* 내번호함 추가 버튼 - 위치 변경 */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center",
                  marginBottom: "12px"
                }}>
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
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    alignItems: "center",
                    lineHeight: "1.3",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: currentColors.textSecondary,
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
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

          {/* 추천이 아직 생성되지 않았을 때만 표시 */}
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
              <div style={{ 
                fontSize: "64px", 
                marginBottom: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "80px",
              }}>
                <IconWrapper size="lg" style={{ fontSize: "64px" }}>
                  {gradeInfo[activeGrade].emoji}
                </IconWrapper>
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: currentColors.text,
                  margin: "0 0 8px 0",
                  lineHeight: "1.2",
                }}
              >
                {gradeInfo[activeGrade].name} 추천번호
              </h3>
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0 0 6px 0",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}
              >
                확률: {gradeInfo[activeGrade].probability}
              </p>
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}
              >
                예상상금: {gradeInfo[activeGrade].prize}
              </p>
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0 0 24px 0",
                  fontSize: "13px",
                  fontStyle: "italic",
                  lineHeight: "1.4",
                }}
              >
                위의 버튼을 클릭하여 AI 분석을 시작하세요!
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
