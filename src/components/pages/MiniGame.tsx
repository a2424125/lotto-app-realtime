import React, { useState, useEffect } from "react";
import LottoNumberBall from "../shared/LottoNumberBall";

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

interface GameStats {
  gamesPlayed: number;
  bestScore: number;
  totalWins: number;
  points: number;
  totalSpent: number;
  totalWon: number;
  dailyBonusDate?: string;
  dailyChargeCount?: number;
  dailyChargeDate?: string;
  dailyAdCount?: number;
  dailyAdDate?: string;
  dailyAdWatchCount?: number;
  dailyAdWatchDate?: string;
  totalAdsWatched?: number;
  totalAdPoints?: number;
}

interface RouletteGameState {
  isSpinning: boolean;
  currentAngle: number;
  targetAngle: number;
  selectedNumber: number | null;
  userBet: number | null;
  betAmount: number;
  cost: number;
  multipliers: Array<{
    range: [number, number];
    multiplier: number;
    color: string;
    startAngle: number;
    endAngle: number;
  }>;
  spinHistory: Array<{
    bet: number;
    result: number;
    multiplier: number;
    winnings: number;
    timestamp: string;
  }>;
}

interface DrawGameState {
  isPlaying: boolean;
  selectedSlot: number | null;
  hoveredSlot: number | null;
  slots: Array<{
    id: number;
    isRevealed: boolean;
    prize: any;
    isWinner: boolean;
  }>;
  result: any;
  cost: number;
  prizes: Array<{
    name: string;
    points: number;
    probability: number;
    emoji: string;
    color: string;
  }>;
}

interface GuessGameState {
  secretNumbers: number[];
  userGuess: number[];
  attempts: number;
  maxAttempts: number;
  hints: string[];
  gameOver: boolean;
  won: boolean;
  score: number;
  cost: number;
  isPlaying: boolean;
  currentRound: number;
}

interface SimulationState {
  selectedNumbers: number[];
  ticketPrice: number;
  currentRound: number;
  results: Array<{
    round: number;
    userNumbers: number[];
    winningNumbers: number[];
    bonusNumber: number;
    matches: number;
    grade: string;
    prize: number;
    spent: number;
  }>;
  isPlaying: boolean;
  autoPlay: boolean;
  speed: number;
  totalSpent: number;
  totalWon: number;
  isSimulating: boolean;
}

interface AdWatchState {
  isWatching: boolean;
  countdown: number;
  adTitle: string;
  adProgress: number;
  canSkip: boolean;
}

const MiniGame: React.FC<MiniGameProps> = ({
  pastWinningNumbers = [],
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
}) => {
  console.log("🎮 MiniGame 컴포넌트 렌더링 시작", { theme, pastWinningNumbers: pastWinningNumbers?.length });

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  
  const defaultGameStats: GameStats = {
    gamesPlayed: 0,
    bestScore: 0,
    totalWins: 0,
    points: 100000,
    totalSpent: 0,
    totalWon: 0,
    dailyChargeCount: 0,
    dailyAdCount: 0,
    dailyAdWatchCount: 0,
    totalAdsWatched: 0,
    totalAdPoints: 0,
  };

  const [gameStats, setGameStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem("lotto-game-stats");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
          bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
          totalWins: typeof parsed.totalWins === 'number' ? parsed.totalWins : 0,
          points: typeof parsed.points === 'number' ? parsed.points : 100000,
          totalSpent: typeof parsed.totalSpent === 'number' ? parsed.totalSpent : 0,
          totalWon: typeof parsed.totalWon === 'number' ? parsed.totalWon : 0,
          dailyBonusDate: parsed.dailyBonusDate || null,
          dailyChargeCount: parsed.dailyChargeCount || 0,
          dailyChargeDate: parsed.dailyChargeDate || null,
          dailyAdCount: parsed.dailyAdCount || 0,
          dailyAdDate: parsed.dailyAdDate || null,
          dailyAdWatchCount: parsed.dailyAdWatchCount || 0,
          dailyAdWatchDate: parsed.dailyAdWatchDate || null,
          totalAdsWatched: parsed.totalAdsWatched || 0,
          totalAdPoints: parsed.totalAdPoints || 0,
        };
      }
      return defaultGameStats;
    } catch (error) {
      console.error("게임 통계 로드 실패:", error);
      return defaultGameStats;
    }
  });

  const [adWatchState, setAdWatchState] = useState<AdWatchState>({
    isWatching: false,
    countdown: 30,
    adTitle: "",
    adProgress: 0,
    canSkip: false,
  });

  const [guessGame, setGuessGame] = useState<GuessGameState>({
    secretNumbers: [],
    userGuess: [],
    attempts: 0,
    maxAttempts: 10,
    hints: [],
    gameOver: false,
    won: false,
    score: 0,
    cost: 2000,
    isPlaying: false,
    currentRound: 1,
  });

  const [simulation, setSimulation] = useState<SimulationState>({
    selectedNumbers: [],
    ticketPrice: 2000,
    currentRound: 0,
    results: [],
    isPlaying: false,
    autoPlay: false,
    speed: 1,
    totalSpent: 0,
    totalWon: 0,
    isSimulating: false,
  });

  const [drawGame, setDrawGame] = useState<DrawGameState>({
    isPlaying: false,
    selectedSlot: null,
    hoveredSlot: null,
    slots: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      isRevealed: false,
      prize: null,
      isWinner: false,
    })),
    result: null,
    cost: 1000,
    prizes: [
      { name: "1등 대박!", points: 5000, probability: 0.02, emoji: "🏆", color: "#FFD700" },
      { name: "2등 잭팟!", points: 2000, probability: 0.05, emoji: "🥈", color: "#C0C0C0" },
      { name: "3등 당첨!", points: 500, probability: 0.08, emoji: "🥉", color: "#CD7F32" },
      { name: "4등 성공!", points: 200, probability: 0.15, emoji: "🎁", color: "#4CAF50" },
      { name: "꽝", points: 0, probability: 0.7, emoji: "😅", color: "#9E9E9E" },
    ],
  });

  const [rouletteGame, setRouletteGame] = useState<RouletteGameState>({
    isSpinning: false,
    currentAngle: 0,
    targetAngle: 0,
    selectedNumber: null,
    userBet: null,
    betAmount: 2000,
    cost: 2000,
    multipliers: [
      { range: [1, 1], multiplier: 50, color: "#FFD700", startAngle: 0, endAngle: 30 },
      { range: [2, 3], multiplier: 25, color: "#FF6B6B", startAngle: 30, endAngle: 60 },
      { range: [4, 6], multiplier: 20, color: "#4ECDC4", startAngle: 60, endAngle: 90 },
      { range: [7, 10], multiplier: 15, color: "#45B7D1", startAngle: 90, endAngle: 120 },
      { range: [11, 15], multiplier: 12, color: "#96CEB4", startAngle: 120, endAngle: 150 },
      { range: [16, 20], multiplier: 10, color: "#FFEAA7", startAngle: 150, endAngle: 180 },
      { range: [21, 25], multiplier: 8, color: "#DDA0DD", startAngle: 180, endAngle: 210 },
      { range: [26, 30], multiplier: 6, color: "#98D8C8", startAngle: 210, endAngle: 240 },
      { range: [31, 35], multiplier: 5, color: "#F7DC6F", startAngle: 240, endAngle: 270 },
      { range: [36, 39], multiplier: 4, color: "#BB8FCE", startAngle: 270, endAngle: 300 },
      { range: [40, 42], multiplier: 3, color: "#85C1E9", startAngle: 300, endAngle: 330 },
      { range: [43, 45], multiplier: 2, color: "#F8C471", startAngle: 330, endAngle: 360 },
    ],
    spinHistory: [],
  });

  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers?.length || 0;

  const safeFormatNumber = (value: any): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return "0";
    }
    return value.toLocaleString();
  };

  const safeCalculatePercentage = (won: any, spent: any): string => {
    const safeWon = typeof won === 'number' ? won : 0;
    const safeSpent = typeof spent === 'number' ? spent : 0;
    
    if (safeSpent <= 0) return "0";
    
    const percentage = ((safeWon - safeSpent) / safeSpent) * 100;
    return isNaN(percentage) ? "0" : percentage.toFixed(1);
  };

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
      purple: "#f3e8ff",
      purpleBorder: "#c084fc",
      purpleText: "#7c3aed",
      drawBg: "#f0f9ff",
      drawBorder: "#0ea5e9",
      slotDefault: "#e0f2fe",
      slotHover: "#bae6fd",
      slotSelected: "#0284c7",
      adBg: "#f0f9ff",
      adBorder: "#0ea5e9",
      adText: "#0c4a6e",
      adButton: "#0ea5e9",
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
      purple: "#581c87",
      purpleBorder: "#8b5cf6",
      purpleText: "#c4b5fd",
      drawBg: "#1e3a8a",
      drawBorder: "#3b82f6",
      slotDefault: "#1e293b",
      slotHover: "#334155",
      slotSelected: "#0ea5e9",
      adBg: "#1e3a8a",
      adBorder: "#3b82f6",
      adText: "#93c5fd",
      adButton: "#3b82f6",
    },
  };

  const currentColors = colors[theme] || colors.light;

  const games = [
    {
      id: "guess",
      name: "번호맞추기",
      desc: "AI 비밀번호를 힌트로 맞춰보세요!",
      emoji: "🎯",
      color: currentColors.primary,
      difficulty: "중급",
      cost: 2000,
    },
    {
      id: "simulation",
      name: "가상 로또 시뮬",
      desc: "포인트로 로또를 사서 결과를 확인해보세요!",
      emoji: "🎲",
      color: "#8b5cf6",
      difficulty: "초급",
      cost: 2000,
    },
    {
      id: "draw",
      name: "추억의 뽑기판",
      desc: "진짜 뽑기판처럼! 칸을 선택해서 상품을 뽑아보세요!",
      emoji: "🎪",
      color: "#f59e0b",
      difficulty: "초급",
      cost: 1000,
    },
    {
      id: "roulette",
      name: "스피드 룰렛",
      desc: "12단계 배율! 룰렛을 돌려서 번호를 맞춰보세요!",
      emoji: "🎡",
      color: "#ef4444",
      difficulty: "중급",
      cost: 2000,
    },
  ];

  useEffect(() => {
    try {
      console.log("🎮 MiniGame useEffect 실행");
      localStorage.setItem("lotto-game-stats", JSON.stringify(gameStats));
    } catch (error) {
      console.error("게임 통계 저장 실패:", error);
    }
  }, [gameStats]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (adWatchState.isWatching && adWatchState.countdown > 0) {
      interval = setInterval(() => {
        setAdWatchState(prev => {
          const newCountdown = prev.countdown - 1;
          const newProgress = ((30 - newCountdown) / 30) * 100;
          
          return {
            ...prev,
            countdown: newCountdown,
            adProgress: newProgress,
            canSkip: newCountdown <= 5,
          };
        });
      }, 1000);
    }
    
    if (adWatchState.isWatching && adWatchState.countdown === 0) {
      completeAdWatch();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adWatchState.isWatching, adWatchState.countdown]);

  const checkDailyAdLimit = (): boolean => {
    const today = new Date().toDateString();
    const maxDailyAds = 10;
    return gameStats.dailyAdWatchDate !== today || (gameStats.dailyAdWatchCount || 0) < maxDailyAds;
  };

  const checkDailyLimit = (type: 'charge' | 'ad'): boolean => {
    const today = new Date().toDateString();
    
    if (type === 'charge') {
      const maxCharge = 3;
      return gameStats.dailyChargeDate !== today || (gameStats.dailyChargeCount || 0) < maxCharge;
    } else {
      const maxAd = 10;
      return gameStats.dailyAdDate !== today || (gameStats.dailyAdCount || 0) < maxAd;
    }
  };

  const startAdWatch = () => {
    if (!checkDailyAdLimit()) {
      alert("😅 오늘 광고 시청 횟수를 모두 사용했어요! 내일 다시 이용해주세요.");
      return;
    }

    const adTitles = [
      "🎮 신규 게임 출시! 지금 다운로드하세요!",
      "🛒 쇼핑몰 할인 이벤트 진행중!",
      "📱 최신 스마트폰 특가 세일!",
      "🍔 맛있는 음식 배달 서비스!",
      "💄 뷰티 제품 신상품 출시!",
      "🏠 부동산 투자 정보 제공!",
      "📚 온라인 강의 무료 체험!",
      "🚗 자동차 렌탈 서비스!"
    ];

    setAdWatchState({
      isWatching: true,
      countdown: 30,
      adTitle: adTitles[Math.floor(Math.random() * adTitles.length)],
      adProgress: 0,
      canSkip: false,
    });

    console.log("📺 광고 시청 시작");
  };

  const completeAdWatch = () => {
    const adPoints = 3000;
    const today = new Date().toDateString();

    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) + adPoints,
      dailyAdWatchCount: prev.dailyAdWatchDate === today ? (prev.dailyAdWatchCount || 0) + 1 : 1,
      dailyAdWatchDate: today,
      totalAdsWatched: (prev.totalAdsWatched || 0) + 1,
      totalAdPoints: (prev.totalAdPoints || 0) + adPoints,
    }));

    setAdWatchState({
      isWatching: false,
      countdown: 30,
      adTitle: "",
      adProgress: 0,
      canSkip: false,
    });

    const remaining = 10 - ((gameStats.dailyAdWatchDate === today ? gameStats.dailyAdWatchCount || 0 : 0) + 1);
    alert(`🎉 광고 시청 완료! ${safeFormatNumber(adPoints)}P 획득!\n오늘 ${remaining}번 더 시청 가능합니다.`);
  };

  const skipAd = () => {
    setAdWatchState({
      isWatching: false,
      countdown: 30,
      adTitle: "",
      adProgress: 0,
      canSkip: false,
    });
    console.log("📺 광고 스킵됨");
  };

  const showAdOfferDialog = (requiredPoints: number, gameName: string) => {
    const currentPoints = gameStats?.points || 0;
    const shortage = requiredPoints - currentPoints;
    
    if (checkDailyAdLimit()) {
      const confirmMessage = `포인트가 ${safeFormatNumber(shortage)}P 부족합니다.\n\n광고를 시청하여 3,000P를 받으시겠습니까?\n(30초 광고 시청 후 ${gameName} 게임을 할 수 있습니다)`;
      
      if (confirm(confirmMessage)) {
        startAdWatch();
        return true;
      }
    } else {
      alert("😅 오늘 광고 시청 횟수를 모두 사용했어요!\n• 일일보너스 (500P)\n• 포인트 충전 (1000P)\n을 이용해주세요!");
    }
    return false;
  };

  const claimDailyBonus = () => {
    const today = new Date().toDateString();
    if (gameStats.dailyBonusDate !== today) {
      const bonusPoints = 500;
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) + bonusPoints,
        dailyBonusDate: today,
      }));
      alert(`🎁 일일 보너스 ${safeFormatNumber(bonusPoints)}P 지급! 내일 또 받으세요!`);
    } else {
      alert("😊 오늘은 이미 보너스를 받았어요. 내일 다시 오세요!");
    }
  };

  const chargePoints = () => {
    if (!checkDailyLimit('charge')) {
      alert("😅 오늘 충전 횟수를 모두 사용했어요! 내일 다시 이용해주세요.");
      return;
    }

    const chargeAmount = 1000;
    const today = new Date().toDateString();
    
    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) + chargeAmount,
      dailyChargeCount: prev.dailyChargeDate === today ? (prev.dailyChargeCount || 0) + 1 : 1,
      dailyChargeDate: today,
    }));
    
    const remaining = 3 - ((gameStats.dailyChargeDate === today ? gameStats.dailyChargeCount || 0 : 0) + 1);
    alert(`💎 ${safeFormatNumber(chargeAmount)}P 충전 완료! 오늘 ${remaining}번 더 충전 가능합니다.`);
  };

  const startGuessGame = () => {
    const currentPoints = gameStats?.points || 0;
    const cost = guessGame.cost;
    
    if (currentPoints < cost) {
      showAdOfferDialog(cost, "번호맞추기");
      return;
    }

    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) - cost,
      totalSpent: (prev?.totalSpent || 0) + cost,
    }));

    const secretNumbers = generateSecretNumbers();
    
    setGuessGame(prev => ({
      ...prev,
      secretNumbers,
      userGuess: [],
      attempts: 0,
      hints: [],
      gameOver: false,
      won: false,
      isPlaying: true,
      currentRound: prev.currentRound + 1,
    }));

    console.log("🎯 번호맞추기 게임 시작! 비밀번호:", secretNumbers);
  };

  const generateSecretNumbers = (): number[] => {
    if (pastWinningNumbers && pastWinningNumbers.length > 0) {
      const randomDraw = pastWinningNumbers[Math.floor(Math.random() * Math.min(10, pastWinningNumbers.length))];
      if (randomDraw && randomDraw.length >= 6) {
        return randomDraw.slice(0, 6).sort((a, b) => a - b);
      }
    }
    
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  const selectRandomGuessNumbers = () => {
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    const randomNumbers = Array.from(numbers).sort((a, b) => a - b);
    setGuessGame(prev => ({ ...prev, userGuess: randomNumbers }));
  };

  const submitGuess = (guess: number[]) => {
    if (guess.length !== 6) {
      alert("6개 번호를 모두 선택해주세요!");
      return;
    }

    const matches = guess.filter(num => guessGame.secretNumbers.includes(num)).length;
    const newAttempts = guessGame.attempts + 1;
    
    let hint = "";
    if (matches === 6) {
      hint = "🎉 완벽! 모든 번호를 맞췄습니다!";
    } else if (matches >= 4) {
      hint = `🔥 훌륭해요! ${matches}개 맞췄습니다! 거의 다 왔어요!`;
    } else if (matches >= 2) {
      hint = `👍 좋아요! ${matches}개 맞췄습니다! 계속 도전하세요!`;
    } else {
      hint = `😅 ${matches}개 맞췄습니다. 다시 한번 시도해보세요!`;
    }

    const newHints = [...guessGame.hints, hint];
    const won = matches === 6;
    const gameOver = won || newAttempts >= guessGame.maxAttempts;

    setGuessGame(prev => ({
      ...prev,
      userGuess: guess,
      attempts: newAttempts,
      hints: newHints,
      gameOver,
      won,
    }));

    if (gameOver) {
      if (won) {
        const prize = 10000;
        setGameStats(prev => ({
          ...prev,
          points: (prev?.points || 0) + prize,
          totalWon: (prev?.totalWon || 0) + prize,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
        }));
        setTimeout(() => alert(`🎉 축하합니다! ${safeFormatNumber(prize)}P 상금을 획득했습니다!`), 500);
      } else {
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        }));
        setTimeout(() => alert(`😢 게임 종료! 정답: ${guessGame.secretNumbers.join(", ")}`), 500);
      }
    }
  };

  if (isDataLoading) {
    return (
      <div 
        style={{ 
          padding: "12px",
          backgroundColor: currentColors.background,
          minHeight: "100vh",
          color: currentColors.text
        }}
      >
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "32px 16px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
            textAlign: "center",
          }}
        >
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
          <p style={{ color: currentColors.textSecondary, margin: "0", fontSize: "14px" }}>
            🎮 미니게임 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!pastWinningNumbers || pastWinningNumbers.length === 0) {
    return (
      <div 
        style={{ 
          padding: "12px",
          backgroundColor: currentColors.background,
          minHeight: "100vh",
          color: currentColors.text
        }}
      >
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "32px 16px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>😔</div>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", color: currentColors.text, margin: "0 0 8px 0" }}>
            데이터를 불러올 수 없습니다
          </h3>
          <p style={{ color: currentColors.textSecondary, margin: "0", fontSize: "14px" }}>
            로또 데이터가 로드되지 않아 미니게임을 시작할 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        padding: "12px",
        backgroundColor: currentColors.background,
        minHeight: "100vh",
        color: currentColors.text
      }}
    >
      {/* 광고 시청 팝업 */}
      {adWatchState.isWatching && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: currentColors.surface,
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
              border: `2px solid ${currentColors.adBorder}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                backgroundColor: currentColors.adBg,
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
                border: `1px solid ${currentColors.adBorder}`,
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: currentColors.adText,
                  margin: "0 0 8px 0",
                }}
              >
                📺 광고 시청 중...
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: currentColors.adText,
                  margin: "0",
                }}
              >
                시청 완료 시 3,000P 지급!
              </p>
            </div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: currentColors.text,
                marginBottom: "16px",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {adWatchState.adTitle}
            </div>

            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: currentColors.gray,
                borderRadius: "4px",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${adWatchState.adProgress}%`,
                  height: "100%",
                  backgroundColor: currentColors.adButton,
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.primary,
                marginBottom: "16px",
              }}
            >
              {adWatchState.countdown}초
            </div>

            {adWatchState.canSkip && (
              <button
                onClick={skipAd}
                style={{
                  padding: "8px 16px",
                  backgroundColor: currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                광고 건너뛰기
              </button>
            )}

            {!adWatchState.canSkip && (
              <p
                style={{
                  fontSize: "10px",
                  color: currentColors.textSecondary,
                  margin: "0",
                }}
              >
                5초 후 건너뛸 수 있습니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* 헤더 */}
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
          🎮 프리미엄 게임센터
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: currentColors.textSecondary,
            margin: "0 0 16px 0",
          }}
        >
          업그레이드된 인터랙티브 게임으로 포인트를 모아보세요!
        </p>

        {/* 포인트 정보 */}
        <div
          style={{
            backgroundColor: currentColors.success,
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${currentColors.successBorder}`,
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold", color: currentColors.successText, marginBottom: "4px" }}>
            💎 {safeFormatNumber(gameStats?.points)}P
          </div>
          <div style={{ fontSize: "12px", color: currentColors.successText, marginBottom: "12px" }}>
            보유 포인트
          </div>
          
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "8px", flexWrap: "wrap" }}>
            <button
              onClick={claimDailyBonus}
              style={{
                padding: "8px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🎁 일일보너스 500P
            </button>
            <button
              onClick={chargePoints}
              disabled={!checkDailyLimit('charge')}
              style={{
                padding: "8px 12px",
                backgroundColor: checkDailyLimit('charge') ? currentColors.primary : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: checkDailyLimit('charge') ? "pointer" : "not-allowed",
                fontWeight: "bold",
                opacity: checkDailyLimit('charge') ? 1 : 0.6,
              }}
            >
              💰 포인트 충전 1000P
            </button>
            <button
              onClick={startAdWatch}
              disabled={!checkDailyAdLimit()}
              style={{
                padding: "8px 12px",
                backgroundColor: checkDailyAdLimit() ? "#ef4444" : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: checkDailyAdLimit() ? "pointer" : "not-allowed",
                fontWeight: "bold",
                opacity: checkDailyAdLimit() ? 1 : 0.6,
                animation: checkDailyAdLimit() ? "pulse 2s infinite" : "none",
              }}
            >
              📺 광고시청 3000P
            </button>
          </div>

          <div style={{ fontSize: "10px", color: currentColors.successText, marginTop: "8px", opacity: 0.8 }}>
            {(() => {
              const today = new Date().toDateString();
              const chargeCount = gameStats.dailyChargeDate === today ? gameStats.dailyChargeCount || 0 : 0;
              const adWatchCount = gameStats.dailyAdWatchDate === today ? gameStats.dailyAdWatchCount || 0 : 0;
              return `포인트 충전: ${chargeCount}/3 | 광고시청: ${adWatchCount}/10`;
            })()}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
          }}
        >
          <div
            style={{
              padding: "8px",
              backgroundColor: currentColors.info,
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.infoText }}>
              {safeFormatNumber(gameStats?.gamesPlayed)}
            </div>
            <div style={{ fontSize: "10px", color: currentColors.infoText }}>
              총 게임 수
            </div>
          </div>
          <div
            style={{
              padding: "8px",
              backgroundColor: currentColors.warning,
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.warningText }}>
              {safeFormatNumber(gameStats?.totalWins)}
            </div>
            <div style={{ fontSize: "10px", color: currentColors.warningText }}>
              총 당첨 수
            </div>
          </div>
          <div
            style={{
              padding: "8px",
              backgroundColor: currentColors.purple,
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.purpleText }}>
              {safeCalculatePercentage(gameStats?.totalWon, gameStats?.totalSpent)}%
            </div>
            <div style={{ fontSize: "10px", color: currentColors.purpleText }}>
              수익률
            </div>
          </div>
          <div
            style={{
              padding: "8px",
              backgroundColor: currentColors.adBg,
              borderRadius: "6px",
              textAlign: "center",
              border: `1px solid ${currentColors.adBorder}`,
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.adText }}>
              {safeFormatNumber(gameStats?.totalAdsWatched || 0)}
            </div>
            <div style={{ fontSize: "10px", color: currentColors.adText }}>
              광고 시청
            </div>
          </div>
        </div>
      </div>

      {/* 게임 선택 화면 */}
      {!selectedGame && (
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  console.log(`🎮 ${game.name} 선택됨`);
                  setSelectedGame(game.id);
                }}
                disabled={isDataLoading}
                style={{
                  padding: "16px 8px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.border}`,
                  backgroundColor: currentColors.surface,
                  cursor: isDataLoading ? "not-allowed" : "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  opacity: isDataLoading ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>{game.emoji}</div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: currentColors.text,
                    margin: "0 0 4px 0",
                  }}
                >
                  {game.name}
                </h4>
                <p
                  style={{
                    fontSize: "11px",
                    color: currentColors.textSecondary,
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  {game.desc}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      backgroundColor: game.color,
                      color: "white",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {safeFormatNumber(game.cost)}P
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      color: currentColors.textSecondary,
                    }}
                  >
                    {game.difficulty}
                  </span>
                </div>
                {(gameStats?.points || 0) < game.cost && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#ef4444",
                      marginTop: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    📺 광고 시청으로 포인트 획득 가능
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 번호맞추기 게임 */}
      {selectedGame === "guess" && (
        <div
          style={{
            backgroundColor: currentColors.surface,
            borderRadius: "12px",
            padding: "16px",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: currentColors.text, margin: "0" }}>
              🎯 번호맞추기
            </h3>
            <button
              onClick={() => setSelectedGame(null)}
              style={{
                padding: "6px 12px",
                backgroundColor: currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              게임 선택으로
            </button>
          </div>

          {!guessGame.isPlaying ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎯</div>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", color: currentColors.text, margin: "0 0 8px 0" }}>
                AI 비밀번호 맞추기
              </h4>
              <p style={{ color: currentColors.textSecondary, margin: "0 0 16px 0", fontSize: "14px" }}>
                과거 당첨번호 중 하나가 비밀번호입니다. 힌트를 보고 맞춰보세요!
              </p>
              <button
                onClick={startGuessGame}
                disabled={(gameStats?.points || 0) < guessGame.cost}
                style={{
                  padding: "16px 24px",
                  backgroundColor: (gameStats?.points || 0) >= guessGame.cost ? currentColors.primary : currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: (gameStats?.points || 0) >= guessGame.cost ? "pointer" : "not-allowed",
                }}
              >
                🎯 게임 시작! ({safeFormatNumber(guessGame.cost)}P)
              </button>
              {(gameStats?.points || 0) < guessGame.cost && (
                <div style={{ marginTop: "12px", fontSize: "12px", color: "#ef4444" }}>
                  포인트가 부족합니다. 광고를 시청하여 3,000P를 받으세요!
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: currentColors.text, marginBottom: "8px" }}>
                  라운드 {guessGame.currentRound} | 시도: {guessGame.attempts}/{guessGame.maxAttempts}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0" }}>
                    번호 선택 (6개)
                  </h4>
                  <button
                    onClick={selectRandomGuessNumbers}
                    disabled={guessGame.gameOver}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#8b5cf6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: guessGame.gameOver ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    🎲 랜덤선택
                  </button>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", marginBottom: "12px" }}>
                  {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        const newGuess = [...guessGame.userGuess];
                        if (newGuess.includes(num)) {
                          const index = newGuess.indexOf(num);
                          newGuess.splice(index, 1);
                        } else if (newGuess.length < 6) {
                          newGuess.push(num);
                        }
                        setGuessGame(prev => ({ ...prev, userGuess: newGuess.sort((a, b) => a - b) }));
                      }}
                      disabled={guessGame.gameOver}
                      style={{
                        width: "32px",
                        height: "28px",
                        borderRadius: "4px",
                        border: guessGame.userGuess.includes(num) ? `2px solid ${currentColors.primary}` : `1px solid ${currentColors.border}`,
                        backgroundColor: guessGame.userGuess.includes(num) ? currentColors.primary : currentColors.surface,
                        color: guessGame.userGuess.includes(num) ? "white" : currentColors.text,
                        fontSize: "11px",
                        cursor: guessGame.gameOver ? "not-allowed" : "pointer",
                        fontWeight: guessGame.userGuess.includes(num) ? "bold" : "normal",
                        opacity: guessGame.gameOver ? 0.6 : 1,
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginBottom: "12px" }}>
                  {guessGame.userGuess.map((num, i) => (
                    <LottoNumberBall key={i} number={num} size="sm" theme={theme} />
                  ))}
                  {Array.from({ length: 6 - guessGame.userGuess.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: currentColors.gray,
                        border: `2px dashed ${currentColors.grayBorder}`,
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
                </div>

                <button
                  onClick={() => submitGuess(guessGame.userGuess)}
                  disabled={guessGame.userGuess.length !== 6 || guessGame.gameOver}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: guessGame.userGuess.length === 6 && !guessGame.gameOver ? currentColors.accent : currentColors.textSecondary,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: guessGame.userGuess.length === 6 && !guessGame.gameOver ? "pointer" : "not-allowed",
                  }}
                >
                  정답 제출!
                </button>
              </div>

              {guessGame.hints.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    힌트 히스토리
                  </h4>
                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {guessGame.hints.map((hint, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "8px",
                          backgroundColor: currentColors.gray,
                          borderRadius: "6px",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: currentColors.text,
                        }}
                      >
                        {index + 1}차: {hint}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guessGame.gameOver && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    padding: "16px",
                    backgroundColor: guessGame.won ? currentColors.success : currentColors.error,
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}>
                    <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                      {guessGame.won ? "🎉" : "😢"}
                    </div>
                    <h4 style={{ 
                      fontSize: "18px", 
                      fontWeight: "bold", 
                      color: guessGame.won ? currentColors.successText : currentColors.errorText,
                      margin: "0 0 8px 0"
                    }}>
                      {guessGame.won ? "축하합니다!" : "게임 종료"}
                    </h4>
                    <p style={{
                      color: guessGame.won ? currentColors.successText : currentColors.errorText,
                      margin: "0",
                      fontSize: "14px",
                    }}>
                      {guessGame.won ? "10,000P 상금 획득!" : `정답: ${guessGame.secretNumbers.join(", ")}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setGuessGame(prev => ({ ...prev, isPlaying: false }))}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: currentColors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    새 게임
                  </button>
                </div>
              )}
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
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes glow {
            0%, 100% { 
              box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.8);
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </div>
  );
