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

const MiniGame: React.FC<MiniGameProps> = ({
  pastWinningNumbers,
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
        };
      }
      return defaultGameStats;
    } catch (error) {
      console.error("게임 통계 로드 실패:", error);
      return defaultGameStats;
    }
  });

  // 번호 맞추기 게임 상태
  const [guessGame, setGuessGame] = useState({
    secretNumbers: [] as number[],
    userGuess: [] as number[],
    attempts: 0,
    maxAttempts: 10,
    hints: [] as string[],
    gameOver: false,
    won: false,
    score: 0,
    cost: 2000,
  });

  // 가상 로또 시뮬레이션 상태
  const [simulation, setSimulation] = useState({
    selectedNumbers: [] as number[],
    ticketPrice: 2000,
    currentRound: 0,
    results: [] as any[],
    isPlaying: false,
    autoPlay: false,
    speed: 1,
  });

  // 🆕 업그레이드된 실제 뽑기게임 상태
  const [drawGame, setDrawGame] = useState<DrawGameState>({
    isPlaying: false,
    selectedSlot: null,
    hoveredSlot: null,
    slots: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      isRevealed: false,
      prize: null,
      isWinner: false,
    })),
    result: null,
    cost: 1000,
    prizes: [
      { name: "1등 대박!", points: 5000, probability: 0.05, emoji: "🏆", color: "#FFD700" },
      { name: "2등 잭팟!", points: 2000, probability: 0.1, emoji: "🥈", color: "#C0C0C0" },
      { name: "3등 당첨!", points: 500, probability: 0.15, emoji: "🥉", color: "#CD7F32" },
      { name: "4등 성공!", points: 200, probability: 0.2, emoji: "🎁", color: "#4CAF50" },
      { name: "꽝", points: 0, probability: 0.5, emoji: "😅", color: "#9E9E9E" },
    ],
  });

  // 🆕 스피드 룰렛 게임 상태
  const [rouletteGame, setRouletteGame] = useState<RouletteGameState>({
    isSpinning: false,
    currentAngle: 0,
    targetAngle: 0,
    selectedNumber: null,
    userBet: null,
    betAmount: 300,
    cost: 2000,
    multipliers: [
      { range: [1, 5], multiplier: 8, color: "#FF6B6B" },
      { range: [6, 15], multiplier: 4, color: "#4ECDC4" },
      { range: [16, 25], multiplier: 3, color: "#45B7D1" },
      { range: [26, 35], multiplier: 2, color: "#96CEB4" },
      { range: [36, 45], multiplier: 1.5, color: "#FFEAA7" },
    ],
    spinHistory: [],
  });

  // 실제 회차 범위 정보 사용
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers?.length || 0;

  // 안전한 숫자 포맷팅 함수
  const safeFormatNumber = (value: any): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return "0";
    }
    return value.toLocaleString();
  };

  // 안전한 계산 함수  
  const safeCalculatePercentage = (won: any, spent: any): string => {
    const safeWon = typeof won === 'number' ? won : 0;
    const safeSpent = typeof spent === 'number' ? spent : 0;
    
    if (safeSpent <= 0) return "0";
    
    const percentage = ((safeWon - safeSpent) / safeSpent) * 100;
    return isNaN(percentage) ? "0" : percentage.toFixed(1);
  };

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
    },
  };

  const currentColors = colors[theme] || colors.light;

  // 업데이트된 게임 목록
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
      desc: "룰렛을 돌려서 번호를 맞춰보세요! 배율이 다양해요!",
      emoji: "🎡",
      color: "#ef4444",
      difficulty: "중급",
      cost: 2000,
    },
  ];

  // useEffect
  useEffect(() => {
    try {
      console.log("🎮 MiniGame useEffect 실행");
      localStorage.setItem("lotto-game-stats", JSON.stringify(gameStats));
    } catch (error) {
      console.error("게임 통계 저장 실패:", error);
    }
  }, [gameStats]);

  // 일일 제한 확인 함수
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

  // 일일 보너스 포인트 지급
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

  // 포인트 충전 (일일 제한)
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

  // 🆕 업그레이드된 실제 뽑기게임 시작
  const startRealisticDrawGame = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const cost = drawGame.cost;
      
      if (currentPoints < cost) {
        alert(`포인트가 부족합니다! ${safeFormatNumber(cost)}P가 필요해요.`);
        return;
      }

      // 포인트 차감
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - cost,
        totalSpent: (prev?.totalSpent || 0) + cost,
      }));

      // 뽑기게임 초기화
      setDrawGame(prev => ({ 
        ...prev, 
        isPlaying: true,
        selectedSlot: null,
        slots: Array.from({ length: 20 }, (_, i) => ({
          id: i,
          isRevealed: false,
          prize: null,
          isWinner: false,
        })),
        result: null
      }));

      alert("🎪 뽑기판에서 원하는 칸을 선택해주세요!");

    } catch (error) {
      console.error("뽑기 게임 실패:", error);
      setDrawGame(prev => ({ 
        ...prev, 
        isPlaying: false,
      }));
    }
  };

  // 🆕 뽑기판 슬롯 선택
  const selectDrawSlot = (slotId: number) => {
    if (!drawGame.isPlaying || drawGame.selectedSlot !== null) return;

    // 슬롯 선택
    setDrawGame(prev => ({
      ...prev,
      selectedSlot: slotId
    }));

    // 1초 후 결과 공개
    setTimeout(() => {
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedPrize = drawGame.prizes[drawGame.prizes.length - 1];

      for (const prize of drawGame.prizes) {
        cumulativeProbability += prize.probability;
        if (random <= cumulativeProbability) {
          selectedPrize = prize;
          break;
        }
      }

      // 결과 적용
      setDrawGame(prev => ({
        ...prev,
        isPlaying: false,
        slots: prev.slots.map(slot => 
          slot.id === slotId 
            ? { ...slot, isRevealed: true, prize: selectedPrize, isWinner: selectedPrize.points > 0 }
            : slot
        ),
        result: selectedPrize,
      }));

      // 통계 업데이트
      if (selectedPrize.points > 0) {
        setGameStats(prev => ({
          ...prev,
          points: (prev?.points || 0) + selectedPrize.points,
          totalWon: (prev?.totalWon || 0) + selectedPrize.points,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
        }));
        
        alert(`🎉 ${selectedPrize.emoji} ${selectedPrize.name} ${safeFormatNumber(selectedPrize.points)}P 획득!`);
      } else {
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        }));
        alert(`${selectedPrize.emoji} ${selectedPrize.name}! 다음 기회에~`);
      }
    }, 1000);
  };

  // 🆕 스피드 룰렛 게임 시작
  const startRouletteGame = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const cost = rouletteGame.cost;
      
      if (currentPoints < cost) {
        alert(`포인트가 부족합니다! ${safeFormatNumber(cost)}P가 필요해요.`);
        return;
      }

      if (rouletteGame.userBet === null) {
        alert("베팅할 번호를 선택해주세요! (1-45)");
        return;
      }

      // 포인트 차감
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - cost,
        totalSpent: (prev?.totalSpent || 0) + cost,
      }));

      // 룰렛 스핀 시작
      setRouletteGame(prev => ({
        ...prev,
        isSpinning: true,
        selectedNumber: null,
      }));

      // 랜덤 결과 생성 (3-5초 후)
      const spinTime = 3000 + Math.random() * 2000;
      const resultNumber = Math.floor(Math.random() * 45) + 1;

      setRouletteGame(prev => ({
        ...prev,
        targetAngle: prev.currentAngle + 360 * 5 + (resultNumber * 8), // 5바퀴 + 결과 각도
      }));

      setTimeout(() => {
        // 스핀 완료
        setRouletteGame(prev => ({
          ...prev,
          isSpinning: false,
          selectedNumber: resultNumber,
          currentAngle: prev.targetAngle,
        }));

        // 결과 계산
        let winnings = 0;
        let multiplier = 0;

        if (rouletteGame.userBet === resultNumber) {
          // 정확히 맞춤 - 특별 보너스
          winnings = rouletteGame.betAmount * 10;
          multiplier = 10;
        } else {
          // 구간별 배율 확인
          for (const mult of rouletteGame.multipliers) {
            if (resultNumber >= mult.range[0] && resultNumber <= mult.range[1]) {
              if (rouletteGame.userBet && rouletteGame.userBet >= mult.range[0] && rouletteGame.userBet <= mult.range[1]) {
                winnings = rouletteGame.betAmount * mult.multiplier;
                multiplier = mult.multiplier;
              }
              break;
            }
          }
        }

        // 통계 업데이트
        if (winnings > 0) {
          setGameStats(prev => ({
            ...prev,
            points: (prev?.points || 0) + winnings,
            totalWon: (prev?.totalWon || 0) + winnings,
            gamesPlayed: (prev?.gamesPlayed || 0) + 1,
            totalWins: (prev?.totalWins || 0) + 1,
          }));
          
          alert(`🎉 룰렛 당첨! ${resultNumber}번 - ${multiplier}배 적중! ${safeFormatNumber(winnings)}P 획득!`);
        } else {
          setGameStats(prev => ({
            ...prev,
            gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          }));
          alert(`😅 아쉽게 꽝! 결과: ${resultNumber}번 (베팅: ${rouletteGame.userBet}번)`);
        }

        // 히스토리 추가
        setRouletteGame(prev => ({
          ...prev,
          spinHistory: [
            {
              bet: prev.userBet || 0,
              result: resultNumber,
              multiplier,
              winnings,
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.spinHistory.slice(0, 4)
          ],
        }));

      }, spinTime);

    } catch (error) {
      console.error("룰렛 게임 실패:", error);
      setRouletteGame(prev => ({ 
        ...prev, 
        isSpinning: false,
      }));
    }
  };

  // 기존 게임들 함수들
  const startGuessGame = () => {
    try {
      if ((gameStats?.points || 0) < guessGame.cost) {
        alert(`포인트가 부족합니다! ${safeFormatNumber(guessGame.cost)}P가 필요해요.`);
        return;
      }

      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - guessGame.cost,
        totalSpent: (prev?.totalSpent || 0) + guessGame.cost,
      }));

      const secret = generateSecretNumbers();
      setGuessGame({
        ...guessGame,
        secretNumbers: secret,
        userGuess: [],
        attempts: 0,
        maxAttempts: 10,
        hints: [],
        gameOver: false,
        won: false,
        score: 0,
      });
      console.log("🎯 번호맞추기 게임 시작");
    } catch (error) {
      console.error("게임 시작 실패:", error);
    }
  };

  const generateSecretNumbers = (): number[] => {
    try {
      const numbers = new Set<number>();
      let attempts = 0;
      while (numbers.size < 6 && attempts < 100) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
        attempts++;
      }
      return Array.from(numbers).sort((a, b) => a - b);
    } catch (error) {
      console.error("비밀번호 생성 실패:", error);
      return [1, 2, 3, 4, 5, 6];
    }
  };

  const submitGuess = () => {
    const userGuess = guessGame?.userGuess || [];
    if (userGuess.length !== 6) return;

    try {
      const secretNumbers = guessGame?.secretNumbers || [];
      const exactMatches = userGuess.filter((num, idx) => num === secretNumbers[idx]).length;
      const numberMatches = userGuess.filter(num => secretNumbers.includes(num)).length;
      const wrongPosition = numberMatches - exactMatches;

      let pointReward = 0;
      if (exactMatches === 6) pointReward = 100000;
      else if (exactMatches >= 4) pointReward = 30000;
      else if (exactMatches >= 2) pointReward = 10000;
      else if (numberMatches >= 3) pointReward = 5000;
      else if (numberMatches >= 1) pointReward = 2000;

      let hint = "";
      if (exactMatches === 6) {
        hint = `🎉 완벽! 모든 번호를 맞췄어요! +${safeFormatNumber(pointReward)}P`;
        setGuessGame(prev => ({
          ...prev,
          gameOver: true,
          won: true,
          score: Math.max(0, 3000 - ((prev?.attempts || 0) * 300)),
          hints: [...(prev?.hints || []), hint],
        }));
        
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
          bestScore: Math.max(prev?.bestScore || 0, Math.max(0, 3000 - ((guessGame?.attempts || 0) * 300))),
          points: (prev?.points || 0) + pointReward,
          totalWon: (prev?.totalWon || 0) + pointReward,
        }));
      } else {
        hint = `🎯 ${exactMatches}개 위치 정확 | 📍 ${wrongPosition}개 숫자 맞지만 위치 틀림`;
        if (pointReward > 0) {
          hint += ` | 🎁 +${safeFormatNumber(pointReward)}P`;
          setGameStats(prev => ({
            ...prev,
            points: (prev?.points || 0) + pointReward,
            totalWon: (prev?.totalWon || 0) + pointReward,
          }));
        }
        
        const newAttempts = (guessGame?.attempts || 0) + 1;
        const maxAttempts = guessGame?.maxAttempts || 10;
        
        if (newAttempts >= maxAttempts) {
          setGuessGame(prev => ({
            ...prev,
            attempts: newAttempts,
            gameOver: true,
            won: false,
            hints: [...(prev?.hints || []), hint, `😔 실패! 정답: ${secretNumbers.join(", ")}`],
          }));
          
          setGameStats(prev => ({
            ...prev,
            gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          }));
        } else {
          setGuessGame(prev => ({
            ...prev,
            attempts: newAttempts,
            hints: [...(prev?.hints || []), hint],
            userGuess: [],
          }));
        }
      }
    } catch (error) {
      console.error("추측 제출 실패:", error);
    }
  };

  const startSimulation = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const ticketPrice = simulation?.ticketPrice || 300;
      
      if (currentPoints < ticketPrice) {
        alert(`포인트가 부족합니다! ${safeFormatNumber(ticketPrice)}P가 필요해요.`);
        return;
      }

      if (!simulation?.selectedNumbers || simulation.selectedNumbers.length !== 6) {
        alert("6개 번호를 선택해주세요!");
        return;
      }

      if (!pastWinningNumbers || pastWinningNumbers.length === 0) {
        alert("당첨번호 데이터가 없습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setSimulation(prev => ({ ...prev, isPlaying: true }));
      
      const randomIndex = Math.floor(Math.random() * pastWinningNumbers.length);
      const winningNumbers = pastWinningNumbers[randomIndex]?.slice(0, 6) || [1, 2, 3, 4, 5, 6];
      const bonusNumber = pastWinningNumbers[randomIndex]?.[6] || 7;

      const matches = simulation.selectedNumbers.filter(num => winningNumbers.includes(num)).length;
      const bonusMatch = simulation.selectedNumbers.includes(bonusNumber);

      let grade = "";
      let prize = 0;
      
      if (matches === 6) {
        grade = "1등";
        prize = 30000;
      } else if (matches === 5 && bonusMatch) {
        grade = "2등";
        prize = 10000;
      } else if (matches === 5) {
        grade = "3등";
        prize = 5000;
      } else if (matches === 4) {
        grade = "4등";
        prize = 1500;
      } else if (matches === 3) {
        grade = "5등";
        prize = 600;
      } else {
        grade = "낙첨";
        prize = 0;
      }

      const result = {
        round: actualLatestRound - randomIndex,
        userNumbers: [...simulation.selectedNumbers],
        winningNumbers,
        bonusNumber,
        matches,
        bonusMatch,
        grade,
        prize,
        spent: ticketPrice,
        profit: prize - ticketPrice,
      };

      setTimeout(() => {
        setSimulation(prev => ({
          ...prev,
          results: [result, ...(prev.results || []).slice(0, 9)],
          isPlaying: false,
          selectedNumbers: [],
        }));

        setGameStats(prev => {
          const currentStats = prev || defaultGameStats;
          return {
            ...currentStats,
            points: (currentStats.points || 0) - ticketPrice + prize,
            totalSpent: (currentStats.totalSpent || 0) + ticketPrice,
            totalWon: (currentStats.totalWon || 0) + prize,
            gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
            totalWins: prize > 0 ? (currentStats.totalWins || 0) + 1 : (currentStats.totalWins || 0),
          };
        });

        if (prize > 0) {
          alert(`🎉 ${grade} 당첨! ${safeFormatNumber(prize)}P 획득!`);
        }
      }, 2000);
    } catch (error) {
      console.error("시뮬레이션 시작 실패:", error);
      setSimulation(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const toggleNumber = (num: number) => {
    try {
      if (selectedGame === "guess") {
        setGuessGame(prev => {
          if ((prev?.userGuess || []).includes(num)) {
            return { ...prev, userGuess: (prev?.userGuess || []).filter(n => n !== num) };
          } else if ((prev?.userGuess || []).length < 6) {
            return { ...prev, userGuess: [...(prev?.userGuess || []), num].sort((a, b) => a - b) };
          }
          return prev;
        });
      } else if (selectedGame === "simulation") {
        setSimulation(prev => {
          if ((prev?.selectedNumbers || []).includes(num)) {
            return { ...prev, selectedNumbers: (prev?.selectedNumbers || []).filter(n => n !== num) };
          } else if ((prev?.selectedNumbers || []).length < 6) {
            return { ...prev, selectedNumbers: [...(prev?.selectedNumbers || []), num].sort((a, b) => a - b) };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("번호 토글 실패:", error);
    }
  };

  const generateRandomNumbers = (target: "guess" | "simulation") => {
    try {
      const numbers = new Set<number>();
      let attempts = 0;
      while (numbers.size < 6 && attempts < 100) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
        attempts++;
      }
      const randomNumbers = Array.from(numbers).sort((a, b) => a - b);

      if (target === "guess") {
        setGuessGame(prev => ({ ...prev, userGuess: randomNumbers }));
      } else {
        setSimulation(prev => ({ ...prev, selectedNumbers: randomNumbers }));
      }
    } catch (error) {
      console.error("랜덤 번호 생성 실패:", error);
    }
  };

  // 로딩 상태 처리
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
          
          {/* 포인트 충전 버튼들 */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "8px" }}>
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
          </div>

          {/* 일일 제한 표시 */}
          <div style={{ fontSize: "10px", color: currentColors.successText, marginTop: "8px", opacity: 0.8 }}>
            {(() => {
              const today = new Date().toDateString();
              const chargeCount = gameStats.dailyChargeDate === today ? gameStats.dailyChargeCount || 0 : 0;
              return `포인트 충전: ${chargeCount}/3`;
            })()}
          </div>
        </div>

        {/* 게임 통계 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
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
                disabled={isDataLoading || (gameStats?.points || 0) < game.cost}
                style={{
                  padding: "16px 8px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.border}`,
                  backgroundColor: (gameStats?.points || 0) >= game.cost ? currentColors.surface : currentColors.gray,
                  cursor: isDataLoading || (gameStats?.points || 0) < game.cost ? "not-allowed" : "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  opacity: isDataLoading || (gameStats?.points || 0) < game.cost ? 0.6 : 1,
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
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🆕 업그레이드된 추억의 뽑기판 */}
      {selectedGame === "draw" && (
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
              🎪 추억의 뽑기판
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

          {/* 뽑기판 (5x4 격자) */}
          <div
            style={{
              backgroundColor: "#FDD835",
              padding: "20px",
              borderRadius: "12px",
              border: "4px solid #F57F17",
              marginBottom: "16px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#1B5E20",
                textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              🎪 추억의 뽑기판 🎪
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                marginTop: "20px",
              }}
            >
              {drawGame.slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => selectDrawSlot(slot.id)}
                  onMouseEnter={() => !drawGame.isPlaying || drawGame.selectedSlot !== null ? null : setDrawGame(prev => ({ ...prev, hoveredSlot: slot.id }))}
                  onMouseLeave={() => setDrawGame(prev => ({ ...prev, hoveredSlot: null }))}
                  disabled={!drawGame.isPlaying || drawGame.selectedSlot !== null}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: slot.isRevealed 
                      ? slot.isWinner ? slot.prize?.color || "#4CAF50" : "#9E9E9E"
                      : drawGame.hoveredSlot === slot.id 
                        ? "#81C784" 
                        : "#2196F3",
                    border: drawGame.selectedSlot === slot.id 
                      ? "3px solid #FF5722" 
                      : "2px solid #0D47A1",
                    color: "white",
                    fontSize: slot.isRevealed ? "20px" : "12px",
                    fontWeight: "bold",
                    cursor: (!drawGame.isPlaying || drawGame.selectedSlot !== null) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    transform: drawGame.hoveredSlot === slot.id ? "scale(1.05)" : "scale(1)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {slot.isRevealed 
                    ? slot.prize?.emoji 
                    : drawGame.selectedSlot === slot.id 
                      ? "?" 
                      : slot.id + 1}
                </button>
              ))}
            </div>

            {/* 게임 상태 표시 */}
            <div
              style={{
                marginTop: "12px",
                textAlign: "center",
                fontSize: "12px",
                color: "#1B5E20",
                fontWeight: "bold",
              }}
            >
              {!drawGame.isPlaying && !drawGame.result && "뽑기 시작 버튼을 눌러주세요!"}
              {drawGame.isPlaying && drawGame.selectedSlot === null && "원하는 칸을 선택하세요!"}
              {drawGame.selectedSlot !== null && !drawGame.result && "결과 확인 중..."}
              {drawGame.result && `결과: ${drawGame.result.name}`}
            </div>
          </div>

          {/* 상품 목록 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              🏆 상품 목록
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {drawGame.prizes.map((prize, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    backgroundColor: currentColors.gray,
                    borderRadius: "6px",
                    border: `1px solid ${currentColors.grayBorder}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{prize.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: currentColors.text }}>
                      {prize.name}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: currentColors.primary }}>
                      {prize.points > 0 ? `${safeFormatNumber(prize.points)}P` : "0P"}
                    </div>
                    <div style={{ fontSize: "9px", color: currentColors.textSecondary }}>
                      {(prize.probability * 100).toFixed(0)}% 확률
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 뽑기 버튼 */}
          <div style={{ textAlign: "center" }}>
            {!drawGame.isPlaying && !drawGame.result && (
              <button
                onClick={startRealisticDrawGame}
                disabled={(gameStats?.points || 0) < drawGame.cost}
                style={{
                  padding: "16px 24px",
                  backgroundColor: (gameStats?.points || 0) >= drawGame.cost ? "#f59e0b" : currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: (gameStats?.points || 0) >= drawGame.cost ? "pointer" : "not-allowed",
                  boxShadow: (gameStats?.points || 0) >= drawGame.cost ? "0 4px 12px rgba(245, 158, 11, 0.3)" : "none",
                }}
              >
                🎪 뽑기 시작! ({safeFormatNumber(drawGame.cost)}P)
              </button>
            )}

            {drawGame.result && (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button
                  onClick={() => setDrawGame(prev => ({ 
                    ...prev, 
                    result: null, 
                    selectedSlot: null,
                    slots: Array.from({ length: 20 }, (_, i) => ({
                      id: i,
                      isRevealed: false,
                      prize: null,
                      isWinner: false,
                    })),
                  }))}
                  style={{
                    padding: "12px 18px",
                    backgroundColor: currentColors.accent,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  🔄 다시 뽑기
                </button>
                <button
                  onClick={startRealisticDrawGame}
                  disabled={(gameStats?.points || 0) < drawGame.cost}
                  style={{
                    padding: "12px 18px",
                    backgroundColor: (gameStats?.points || 0) >= drawGame.cost ? "#f59e0b" : currentColors.textSecondary,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: (gameStats?.points || 0) >= drawGame.cost ? "pointer" : "not-allowed",
                    fontWeight: "bold",
                  }}
                >
                  🎪 새 게임 ({safeFormatNumber(drawGame.cost)}P)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🆕 스피드 룰렛 게임 */}
      {selectedGame === "roulette" && (
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
              🎡 스피드 룰렛
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

          {/* 룰렛 휠 */}
          <div
            style={{
              position: "relative",
              width: "200px",
              height: "200px",
              margin: "20px auto",
              borderRadius: "50%",
              background: `conic-gradient(
                #FF6B6B 0deg 40deg,
                #4ECDC4 40deg 120deg,
                #45B7D1 120deg 200deg,
                #96CEB4 200deg 280deg,
                #FFEAA7 280deg 360deg
              )`,
              border: "8px solid #2C3E50",
              transform: `rotate(${rouletteGame.currentAngle}deg)`,
              transition: rouletteGame.isSpinning ? `transform ${3 + Math.random() * 2}s cubic-bezier(0.2, 0.8, 0.7, 0.99)` : "none",
            }}
          >
            {/* 중앙 포인터 */}
            <div
              style={{
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "20px solid #E74C3C",
                zIndex: 10,
              }}
            />

            {/* 중앙 버튼 */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#2C3E50",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
                zIndex: 5,
              }}
            >
              {rouletteGame.selectedNumber || "?"}
            </div>

            {/* 구간 라벨들 */}
            <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", color: "white", fontSize: "10px", fontWeight: "bold" }}>1-5<br/>×8</div>
            <div style={{ position: "absolute", top: "30%", right: "10px", color: "white", fontSize: "10px", fontWeight: "bold" }}>6-15<br/>×4</div>
            <div style={{ position: "absolute", bottom: "30%", right: "10px", color: "white", fontSize: "10px", fontWeight: "bold" }}>16-25<br/>×3</div>
            <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", color: "white", fontSize: "10px", fontWeight: "bold" }}>26-35<br/>×2</div>
            <div style={{ position: "absolute", top: "30%", left: "10px", color: "white", fontSize: "10px", fontWeight: "bold" }}>36-45<br/>×1.5</div>
          </div>

          {/* 베팅 번호 선택 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0", textAlign: "center" }}>
              베팅할 번호 선택 (1-45)
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(9, 1fr)", 
              gap: "4px",
              maxWidth: "360px",
              margin: "0 auto 12px"
            }}>
              {Array.from({ length: 45 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setRouletteGame(prev => ({ ...prev, userBet: num }))}
                  disabled={rouletteGame.isSpinning}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    border: rouletteGame.userBet === num 
                      ? `2px solid ${currentColors.primary}` 
                      : `1px solid ${currentColors.border}`,
                    backgroundColor: rouletteGame.userBet === num 
                      ? currentColors.primary 
                      : currentColors.surface,
                    color: rouletteGame.userBet === num 
                      ? "white" 
                      : currentColors.text,
                    fontSize: "11px",
                    fontWeight: rouletteGame.userBet === num ? "bold" : "normal",
                    cursor: rouletteGame.isSpinning ? "not-allowed" : "pointer",
                    opacity: rouletteGame.isSpinning ? 0.6 : 1,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {rouletteGame.userBet && (
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <p style={{ color: currentColors.primary, fontSize: "14px", fontWeight: "bold", margin: "0" }}>
                  베팅 번호: {rouletteGame.userBet}번 | 베팅금: {safeFormatNumber(rouletteGame.betAmount)}P
                </p>
              </div>
            )}
          </div>

          {/* 배율 안내 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              🎯 배율 안내
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "12px", color: currentColors.textSecondary, marginBottom: "4px" }}>
                <strong>정확히 맞춤:</strong> 10배 (특별 보너스!)
              </div>
              {rouletteGame.multipliers.map((mult, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 8px",
                    backgroundColor: currentColors.gray,
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: currentColors.text }}>
                    {mult.range[0]}-{mult.range[1]}번 구간
                  </span>
                  <span style={{ color: mult.color, fontWeight: "bold" }}>
                    {mult.multiplier}배
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 스핀 버튼 */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <button
              onClick={startRouletteGame}
              disabled={rouletteGame.isSpinning || !rouletteGame.userBet || (gameStats?.points || 0) < rouletteGame.cost}
              style={{
                padding: "16px 24px",
                backgroundColor: 
                  !rouletteGame.isSpinning && rouletteGame.userBet && (gameStats?.points || 0) >= rouletteGame.cost
                    ? "#ef4444" 
                    : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: 
                  !rouletteGame.isSpinning && rouletteGame.userBet && (gameStats?.points || 0) >= rouletteGame.cost
                    ? "pointer" 
                    : "not-allowed",
                boxShadow: 
                  !rouletteGame.isSpinning && rouletteGame.userBet && (gameStats?.points || 0) >= rouletteGame.cost
                    ? "0 4px 12px rgba(239, 68, 68, 0.3)" 
                    : "none",
              }}
            >
              {rouletteGame.isSpinning 
                ? "🎡 룰렛 돌리는 중..." 
                : !rouletteGame.userBet 
                  ? "번호를 선택하세요"
                  : `🎡 룰렛 돌리기! (${safeFormatNumber(rouletteGame.cost)}P)`}
            </button>
          </div>

          {/* 게임 히스토리 */}
          {rouletteGame.spinHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                📊 최근 게임 기록
              </h4>
              <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                {rouletteGame.spinHistory.map((spin, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "6px 8px",
                      marginBottom: "4px",
                      backgroundColor: spin.winnings > 0 ? currentColors.success : currentColors.error,
                      borderRadius: "4px",
                      border: spin.winnings > 0 ? `1px solid ${currentColors.successBorder}` : `1px solid ${currentColors.errorBorder}`,
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ 
                        color: spin.winnings > 0 ? currentColors.successText : currentColors.errorText,
                        fontWeight: "bold"
                      }}>
                        베팅: {spin.bet}번 → 결과: {spin.result}번
                      </span>
                      <span style={{ 
                        color: spin.winnings > 0 ? currentColors.successText : currentColors.errorText,
                        fontWeight: "bold"
                      }}>
                        {spin.winnings > 0 ? `+${safeFormatNumber(spin.winnings)}P` : "꽝"}
                      </span>
                    </div>
                    {spin.multiplier > 0 && (
                      <div style={{ 
                        color: spin.winnings > 0 ? currentColors.successText : currentColors.errorText,
                        fontSize: "10px",
                        marginTop: "2px"
                      }}>
                        {spin.multiplier}배 적중 | {spin.timestamp}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 기존 게임들 (번호맞추기, 가상로또) */}
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
              🎯 번호 맞추기 게임
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

          {(guessGame?.secretNumbers || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
              <h4 style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.text, margin: "0 0 8px 0" }}>
                번호 맞추기 게임
              </h4>
              <p style={{ fontSize: "14px", color: currentColors.textSecondary, margin: "0 0 16px 0" }}>
                AI가 만든 비밀 번호 6개를 힌트로 맞춰보세요!
              </p>
              <p style={{ fontSize: "12px", color: currentColors.primary, margin: "0 0 16px 0" }}>
                💎 비용: {safeFormatNumber(guessGame.cost)}P | 1개라도 맞추면 포인트 획득!
              </p>
              <button
                onClick={startGuessGame}
                disabled={(gameStats?.points || 0) < guessGame.cost}
                style={{
                  padding: "12px 24px",
                  backgroundColor: (gameStats?.points || 0) >= guessGame.cost ? currentColors.primary : currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: (gameStats?.points || 0) >= guessGame.cost ? "pointer" : "not-allowed",
                }}
              >
                🎮 게임 시작 ({safeFormatNumber(guessGame.cost)}P)
              </button>
            </div>
          ) : (
            /* 번호맞추기 게임 진행 화면 */
            <>
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: currentColors.textSecondary, margin: "0 0 8px 0" }}>
                  AI가 만든 비밀 번호 6개를 맞춰보세요!
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "14px" }}>
                  <span style={{ color: currentColors.primary, fontWeight: "bold" }}>
                    시도: {guessGame?.attempts || 0}/{guessGame?.maxAttempts || 10}
                  </span>
                  <span style={{ color: currentColors.accent, fontWeight: "bold" }}>
                    점수: {safeFormatNumber(guessGame?.score || 0)}
                  </span>
                </div>
              </div>

              {/* 번호 선택 grid */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                  번호를 선택하세요 ({(guessGame?.userGuess || []).length}/6)
                </h4>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(9, 1fr)", 
                  gap: "4px",
                  maxWidth: "360px",
                  margin: "0 auto 12px"
                }}>
                  {Array.from({ length: 45 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      disabled={guessGame?.gameOver || false}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        border: (guessGame?.userGuess || []).includes(num) 
                          ? `2px solid ${currentColors.primary}` 
                          : `1px solid ${currentColors.border}`,
                        backgroundColor: (guessGame?.userGuess || []).includes(num) 
                          ? currentColors.primary 
                          : currentColors.surface,
                        color: (guessGame?.userGuess || []).includes(num) 
                          ? "white" 
                          : currentColors.text,
                        fontSize: "11px",
                        fontWeight: (guessGame?.userGuess || []).includes(num) ? "bold" : "normal",
                        cursor: (guessGame?.gameOver || false) ? "not-allowed" : "pointer",
                        opacity: (guessGame?.gameOver || false) ? 0.6 : 1,
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* 선택된 번호 표시 */}
                <div style={{ textAlign: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                    {(guessGame?.userGuess || []).map((num, i) => (
                      <LottoNumberBall key={i} number={num} size="sm" theme={theme} />
                    ))}
                    {Array.from({ length: 6 - (guessGame?.userGuess || []).length }).map((_, i) => (
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
                </div>

                {/* 게임 버튼들 */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button
                    onClick={() => generateRandomNumbers("guess")}
                    disabled={guessGame?.gameOver || false}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: currentColors.accent,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: (guessGame?.gameOver || false) ? "not-allowed" : "pointer",
                      opacity: (guessGame?.gameOver || false) ? 0.6 : 1,
                    }}
                  >
                    🎲 랜덤
                  </button>
                  <button
                    onClick={submitGuess}
                    disabled={(guessGame?.userGuess || []).length !== 6 || (guessGame?.gameOver || false)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: (guessGame?.userGuess || []).length === 6 ? currentColors.primary : currentColors.textSecondary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: (guessGame?.userGuess || []).length === 6 && !(guessGame?.gameOver || false) ? "pointer" : "not-allowed",
                    }}
                  >
                    🎯 추측하기
                  </button>
                  {(guessGame?.gameOver || false) && (
                    <button
                      onClick={startGuessGame}
                      disabled={(gameStats?.points || 0) < guessGame.cost}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: (gameStats?.points || 0) >= guessGame.cost ? "#10b981" : currentColors.textSecondary,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: (gameStats?.points || 0) >= guessGame.cost ? "pointer" : "not-allowed",
                      }}
                    >
                      🔄 다시하기
                    </button>
                  )}
                </div>
              </div>

              {/* 힌트 및 결과 */}
              {(guessGame?.hints || []).length > 0 && (
                <div
                  style={{
                    backgroundColor: currentColors.gray,
                    padding: "12px",
                    borderRadius: "8px",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    💡 힌트 기록
                  </h4>
                  {(guessGame?.hints || []).map((hint, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: "12px",
                        color: currentColors.textSecondary,
                        marginBottom: "4px",
                        padding: "4px 8px",
                        backgroundColor: currentColors.surface,
                        borderRadius: "4px",
                      }}
                    >
                      {index + 1}. {hint}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 가상 로또 시뮬레이션 */}
      {selectedGame === "simulation" && (
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
              🎲 가상 로또 시뮬레이션
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

          {/* 포인트 정보 */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: currentColors.primary }}>
              💎 {safeFormatNumber(gameStats?.points)}P
            </div>
            <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>
              수익률: {safeCalculatePercentage(gameStats?.totalWon, gameStats?.totalSpent)}%
            </div>
          </div>

          {(simulation?.isPlaying || false) ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
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
              <p style={{ color: currentColors.text, fontSize: "16px", fontWeight: "bold" }}>
                🎲 추첨 중...
              </p>
              <p style={{ color: currentColors.textSecondary, fontSize: "12px" }}>
                과거 당첨번호와 비교하고 있습니다
              </p>
            </div>
          ) : (
            <>
              {/* 번호 선택 */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                  로또 번호 선택 ({(simulation?.selectedNumbers || []).length}/6) - {safeFormatNumber(simulation?.ticketPrice)}P
                </h4>
                
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(9, 1fr)", 
                  gap: "4px",
                  maxWidth: "360px",
                  margin: "0 auto 12px"
                }}>
                  {Array.from({ length: 45 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        border: (simulation?.selectedNumbers || []).includes(num) 
                          ? `2px solid ${currentColors.primary}` 
                          : `1px solid ${currentColors.border}`,
                        backgroundColor: (simulation?.selectedNumbers || []).includes(num) 
                          ? currentColors.primary 
                          : currentColors.surface,
                        color: (simulation?.selectedNumbers || []).includes(num) 
                          ? "white" 
                          : currentColors.text,
                        fontSize: "11px",
                        fontWeight: (simulation?.selectedNumbers || []).includes(num) ? "bold" : "normal",
                        cursor: "pointer",
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* 선택된 번호 표시 */}
                <div style={{ textAlign: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                    {(simulation?.selectedNumbers || []).map((num, i) => (
                      <LottoNumberBall key={i} number={num} size="sm" theme={theme} />
                    ))}
                    {Array.from({ length: 6 - (simulation?.selectedNumbers || []).length }).map((_, i) => (
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
                </div>

                {/* 게임 버튼들 */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button
                    onClick={() => generateRandomNumbers("simulation")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: currentColors.accent,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🎲 자동선택
                  </button>
                  <button
                    onClick={startSimulation}
                    disabled={
                      (simulation?.selectedNumbers || []).length !== 6 || 
                      (gameStats?.points || 0) < (simulation?.ticketPrice || 300)
                    }
                    style={{
                      padding: "8px 16px",
                      backgroundColor: 
                        (simulation?.selectedNumbers || []).length === 6 && 
                        (gameStats?.points || 0) >= (simulation?.ticketPrice || 300)
                          ? currentColors.primary 
                          : currentColors.textSecondary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: 
                        (simulation?.selectedNumbers || []).length === 6 && 
                        (gameStats?.points || 0) >= (simulation?.ticketPrice || 300)
                          ? "pointer" 
                          : "not-allowed",
                    }}
                  >
                    🎫 로또 구매하기 ({safeFormatNumber(simulation?.ticketPrice || 300)}P)
                  </button>
                </div>
              </div>

              {/* 결과 기록 */}
              {(simulation?.results || []).length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    📊 최근 게임 결과
                  </h4>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {(simulation?.results || []).map((result, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "8px",
                          marginBottom: "8px",
                          backgroundColor: result.grade === "낙첨" 
                            ? currentColors.error 
                            : currentColors.success,
                          borderRadius: "6px",
                          border: result.grade === "낙첨" 
                            ? `1px solid ${currentColors.errorBorder}` 
                            : `1px solid ${currentColors.successBorder}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold",
                            color: result.grade === "낙첨" ? currentColors.errorText : currentColors.successText,
                          }}>
                            {safeFormatNumber(result.round)}회차 - {result.grade}
                          </span>
                          <span style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold",
                            color: (result.profit || 0) > 0 ? currentColors.successText : currentColors.errorText,
                          }}>
                            {(result.profit || 0) > 0 ? "+" : ""}{safeFormatNumber(result.profit)}P
                          </span>
                        </div>
                        <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                          내 번호: {(result.userNumbers || []).join(", ")} | 당첨번호: {(result.winningNumbers || []).join(", ")}+{safeFormatNumber(result.bonusNumber)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
};

export default MiniGame;
