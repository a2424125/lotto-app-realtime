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

  // 가상 로또 시뮬레이션 상태
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

  // 뽑기게임 상태
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

  // 스피드 룰렛 게임 상태
  const [rouletteGame, setRouletteGame] = useState<RouletteGameState>({
    isSpinning: false,
    currentAngle: 0,
    targetAngle: 0,
    selectedNumber: null,
    userBet: null,
    betAmount: 2000,
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
      drawBg: "#f0f9ff",
      drawBorder: "#0ea5e9",
      slotDefault: "#e0f2fe",
      slotHover: "#bae6fd",
      slotSelected: "#0284c7",
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
    },
  };

  const currentColors = colors[theme] || colors.light;

  // 게임 목록
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

  // 🎯 번호맞추기 게임 함수들
  const startGuessGame = () => {
    const currentPoints = gameStats?.points || 0;
    const cost = guessGame.cost;
    
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

    // 비밀번호 생성 (과거 당첨번호 기반)
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
    if (pastWinningNumbers.length > 0) {
      // 과거 당첨번호에서 랜덤 선택
      const randomDraw = pastWinningNumbers[Math.floor(Math.random() * Math.min(10, pastWinningNumbers.length))];
      return randomDraw.slice(0, 6).sort((a, b) => a - b);
    } else {
      // 폴백: 랜덤 생성
      const numbers = new Set<number>();
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
      }
      return Array.from(numbers).sort((a, b) => a - b);
    }
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

    // 게임 완료 처리
    if (gameOver) {
      if (won) {
        const prize = 10000; // 1만 포인트 상금
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

  // 🎲 가상 로또 시뮬레이션 함수들
  const startSimulation = () => {
    if (simulation.selectedNumbers.length !== 6) {
      alert("6개 번호를 선택해주세요!");
      return;
    }

    const currentPoints = gameStats?.points || 0;
    const cost = simulation.ticketPrice;
    
    if (currentPoints < cost) {
      alert(`포인트가 부족합니다! ${safeFormatNumber(cost)}P가 필요해요.`);
      return;
    }

    setSimulation(prev => ({
      ...prev,
      isPlaying: true,
      isSimulating: true,
      currentRound: prev.currentRound + 1,
      totalSpent: prev.totalSpent + cost,
    }));

    // 포인트 차감
    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) - cost,
      totalSpent: (prev?.totalSpent || 0) + cost,
    }));

    // 시뮬레이션 실행
    setTimeout(() => {
      runLottoSimulation();
    }, 1000);
  };

  const runLottoSimulation = () => {
    // 가상 당첨번호 생성
    const winningNumbers = new Set<number>();
    while (winningNumbers.size < 6) {
      winningNumbers.add(Math.floor(Math.random() * 45) + 1);
    }
    const winningArray = Array.from(winningNumbers).sort((a, b) => a - b);
    const bonusNumber = Math.floor(Math.random() * 45) + 1;

    // 매치 계산
    const matches = simulation.selectedNumbers.filter(num => winningArray.includes(num)).length;
    const bonusMatch = simulation.selectedNumbers.includes(bonusNumber);

    // 등급 및 상금 계산
    let grade = "낙첨";
    let prize = 0;

    if (matches === 6) {
      grade = "1등";
      prize = 2000000000; // 20억
    } else if (matches === 5 && bonusMatch) {
      grade = "2등";
      prize = 60000000; // 6천만
    } else if (matches === 5) {
      grade = "3등";
      prize = 1500000; // 150만
    } else if (matches === 4) {
      grade = "4등";
      prize = 50000; // 5만
    } else if (matches === 3) {
      grade = "5등";
      prize = 5000; // 5천
    }

    const newResult = {
      round: simulation.currentRound,
      userNumbers: [...simulation.selectedNumbers],
      winningNumbers: winningArray,
      bonusNumber,
      matches,
      grade,
      prize,
      spent: simulation.ticketPrice,
    };

    setSimulation(prev => ({
      ...prev,
      results: [newResult, ...prev.results],
      totalWon: prev.totalWon + prize,
      isSimulating: false,
    }));

    // 상금 지급
    if (prize > 0) {
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) + prize,
        totalWon: (prev?.totalWon || 0) + prize,
        gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        totalWins: (prev?.totalWins || 0) + 1,
      }));
    } else {
      setGameStats(prev => ({
        ...prev,
        gamesPlayed: (prev?.gamesPlayed || 0) + 1,
      }));
    }
  };

  const selectSimulationNumber = (num: number) => {
    setSimulation(prev => {
      if (prev.selectedNumbers.includes(num)) {
        return {
          ...prev,
          selectedNumbers: prev.selectedNumbers.filter(n => n !== num),
        };
      } else if (prev.selectedNumbers.length < 6) {
        return {
          ...prev,
          selectedNumbers: [...prev.selectedNumbers, num].sort((a, b) => a - b),
        };
      }
      return prev;
    });
  };

  // 뽑기게임 함수들 (기존과 동일)
  const startRealisticDrawGame = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const cost = drawGame.cost;
      
      if (currentPoints < cost) {
        alert(`포인트가 부족합니다! ${safeFormatNumber(cost)}P가 필요해요.`);
        return;
      }

      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - cost,
        totalSpent: (prev?.totalSpent || 0) + cost,
      }));

      setDrawGame(prev => ({ 
        ...prev, 
        isPlaying: true,
        selectedSlot: null,
        slots: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          isRevealed: false,
          prize: null,
          isWinner: false,
        })),
        result: null
      }));

      console.log("🎪 10x10 뽑기판 게임 시작!");

    } catch (error) {
      console.error("뽑기 게임 실패:", error);
      setDrawGame(prev => ({ 
        ...prev, 
        isPlaying: false,
      }));
    }
  };

  const selectDrawSlot = (slotId: number) => {
    if (!drawGame.isPlaying || drawGame.selectedSlot !== null) return;

    setDrawGame(prev => ({
      ...prev,
      selectedSlot: slotId
    }));

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

    setTimeout(() => {
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

      if (selectedPrize.points > 0) {
        setGameStats(prev => ({
          ...prev,
          points: (prev?.points || 0) + selectedPrize.points,
          totalWon: (prev?.totalWon || 0) + selectedPrize.points,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
        }));
      } else {
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        }));
      }
    }, 500);
  };

  // 🎡 스피드 룰렛 함수들
  const startRouletteGame = () => {
    const currentPoints = gameStats?.points || 0;
    const cost = rouletteGame.cost;
    
    if (currentPoints < cost) {
      alert(`포인트가 부족합니다! ${safeFormatNumber(cost)}P가 필요해요.`);
      return;
    }

    if (rouletteGame.userBet === null) {
      alert("먼저 번호를 선택해주세요!");
      return;
    }

    // 포인트 차감
    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) - cost,
      totalSpent: (prev?.totalSpent || 0) + cost,
    }));

    // 룰렛 회전 시작
    setRouletteGame(prev => ({
      ...prev,
      isSpinning: true,
    }));

    // 결과 계산 및 애니메이션
    setTimeout(() => {
      const result = Math.floor(Math.random() * 45) + 1;
      let multiplier = 1;
      let winnings = 0;

      // 배율 계산
      for (const mult of rouletteGame.multipliers) {
        if (result >= mult.range[0] && result <= mult.range[1]) {
          multiplier = mult.multiplier;
          break;
        }
      }

      // 당첨 확인
      if (result === rouletteGame.userBet) {
        winnings = rouletteGame.betAmount * multiplier;
      }

      const newHistory = {
        bet: rouletteGame.userBet!,
        result,
        multiplier,
        winnings,
        timestamp: new Date().toLocaleTimeString(),
      };

      setRouletteGame(prev => ({
        ...prev,
        isSpinning: false,
        selectedNumber: result,
        spinHistory: [newHistory, ...prev.spinHistory.slice(0, 4)],
      }));

      // 상금 지급
      if (winnings > 0) {
        setGameStats(prev => ({
          ...prev,
          points: (prev?.points || 0) + winnings,
          totalWon: (prev?.totalWon || 0) + winnings,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
        }));
        setTimeout(() => alert(`🎉 당첨! ${safeFormatNumber(winnings)}P 획득!`), 500);
      } else {
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        }));
      }
    }, 2000);
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

      {/* 🎯 번호맞추기 게임 */}
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
            </div>
          ) : (
            <div>
              {/* 게임 정보 */}
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: currentColors.text, marginBottom: "8px" }}>
                  라운드 {guessGame.currentRound} | 시도: {guessGame.attempts}/{guessGame.maxAttempts}
                </div>
              </div>

              {/* 번호 선택 */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                  번호 선택 (6개)
                </h4>
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
                      style={{
                        width: "32px",
                        height: "28px",
                        borderRadius: "4px",
                        border: guessGame.userGuess.includes(num) ? `2px solid ${currentColors.primary}` : `1px solid ${currentColors.border}`,
                        backgroundColor: guessGame.userGuess.includes(num) ? currentColors.primary : currentColors.surface,
                        color: guessGame.userGuess.includes(num) ? "white" : currentColors.text,
                        fontSize: "11px",
                        cursor: "pointer",
                        fontWeight: guessGame.userGuess.includes(num) ? "bold" : "normal",
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* 선택된 번호 표시 */}
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

              {/* 힌트 히스토리 */}
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

              {/* 게임 종료 */}
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

      {/* 🎲 가상 로또 시뮬레이션 */}
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

          {/* 번호 선택 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              로또 번호 선택 (6개)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", marginBottom: "12px" }}>
              {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => selectSimulationNumber(num)}
                  style={{
                    width: "32px",
                    height: "28px",
                    borderRadius: "4px",
                    border: simulation.selectedNumbers.includes(num) ? `2px solid ${currentColors.primary}` : `1px solid ${currentColors.border}`,
                    backgroundColor: simulation.selectedNumbers.includes(num) ? currentColors.primary : currentColors.surface,
                    color: simulation.selectedNumbers.includes(num) ? "white" : currentColors.text,
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: simulation.selectedNumbers.includes(num) ? "bold" : "normal",
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* 선택된 번호 표시 */}
            <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginBottom: "12px" }}>
              {simulation.selectedNumbers.map((num, i) => (
                <LottoNumberBall key={i} number={num} size="sm" theme={theme} />
              ))}
              {Array.from({ length: 6 - simulation.selectedNumbers.length }).map((_, i) => (
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
              onClick={startSimulation}
              disabled={simulation.selectedNumbers.length !== 6 || simulation.isSimulating}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: simulation.selectedNumbers.length === 6 && !simulation.isSimulating ? "#8b5cf6" : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: simulation.selectedNumbers.length === 6 && !simulation.isSimulating ? "pointer" : "not-allowed",
              }}
            >
              {simulation.isSimulating ? "추첨 중..." : `🎲 가상 추첨! (${safeFormatNumber(simulation.ticketPrice)}P)`}
            </button>
          </div>

          {/* 통계 */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "8px",
            marginBottom: "16px"
          }}>
            <div style={{ padding: "8px", backgroundColor: currentColors.gray, borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: currentColors.text }}>
                {simulation.results.length}
              </div>
              <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                총 게임
              </div>
            </div>
            <div style={{ padding: "8px", backgroundColor: currentColors.gray, borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: currentColors.text }}>
                {safeFormatNumber(simulation.totalSpent)}P
              </div>
              <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                총 지출
              </div>
            </div>
            <div style={{ padding: "8px", backgroundColor: currentColors.gray, borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: currentColors.text }}>
                {safeFormatNumber(simulation.totalWon)}P
              </div>
              <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                총 상금
              </div>
            </div>
          </div>

          {/* 결과 히스토리 */}
          {simulation.results.length > 0 && (
            <div>
              <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                추첨 결과 ({simulation.results.length}회)
              </h4>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {simulation.results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      backgroundColor: result.grade !== "낙첨" ? currentColors.success : currentColors.gray,
                      borderRadius: "6px",
                      marginBottom: "8px",
                      border: result.grade !== "낙첨" ? `1px solid ${currentColors.successBorder}` : `1px solid ${currentColors.grayBorder}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: currentColors.text }}>
                        {result.round}회차 - {result.grade}
                      </span>
                      <span style={{ 
                        fontSize: "12px", 
                        fontWeight: "bold", 
                        color: result.prize > 0 ? currentColors.successText : currentColors.textSecondary
                      }}>
                        {result.prize > 0 ? `+${safeFormatNumber(result.prize)}P` : "꽝"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginBottom: "4px" }}>
                      {result.userNumbers.map((num, i) => (
                        <div
                          key={i}
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: result.winningNumbers.includes(num) ? "#10b981" : "#6b7280",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "10px", color: currentColors.textSecondary, textAlign: "center" }}>
                      당첨번호: {result.winningNumbers.join(", ")} + {result.bonusNumber} | {result.matches}개 일치
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🎪 추억의 뽑기판 (기존과 동일) */}
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

          {/* 뽑기판 */}
          <div
            style={{
              backgroundColor: currentColors.drawBg,
              padding: "20px",
              borderRadius: "12px",
              border: `4px solid ${currentColors.drawBorder}`,
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
                color: currentColors.text,
                textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              🎪 추억의 뽑기판 🎪
            </div>

            {/* 10x10 사각형 격자 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: "4px",
                marginTop: "20px",
                maxWidth: "320px",
                margin: "20px auto 0",
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
                    width: "26px",
                    height: "26px",
                    borderRadius: "4px",
                    backgroundColor: slot.isRevealed 
                      ? slot.isWinner ? slot.prize?.color || "#4CAF50" : "#9E9E9E"
                      : drawGame.hoveredSlot === slot.id 
                        ? currentColors.slotHover
                        : currentColors.slotDefault,
                    border: drawGame.selectedSlot === slot.id 
                      ? `2px solid ${currentColors.slotSelected}` 
                      : `1px solid ${currentColors.border}`,
                    color: slot.isRevealed ? "white" : currentColors.text,
                    fontSize: slot.isRevealed ? "16px" : "14px",
                    fontWeight: "bold",
                    cursor: (!drawGame.isPlaying || drawGame.selectedSlot !== null) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transform: drawGame.hoveredSlot === slot.id ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {slot.isRevealed 
                    ? slot.prize?.emoji
                    : drawGame.selectedSlot === slot.id 
                      ? "⏳" 
                      : "⭐"}
                </button>
              ))}
            </div>

            {/* 게임 상태 표시 */}
            <div
              style={{
                marginTop: "12px",
                textAlign: "center",
                fontSize: "12px",
                color: currentColors.text,
                fontWeight: "bold",
              }}
            >
              {!drawGame.isPlaying && !drawGame.result && "뽑기 시작 버튼을 눌러주세요!"}
              {drawGame.isPlaying && drawGame.selectedSlot === null && "원하는 칸을 선택하세요!"}
              {drawGame.selectedSlot !== null && !drawGame.result && "결과 확인 중..."}
              {drawGame.result && `${drawGame.result.name} - ${safeFormatNumber(drawGame.result.points)}P`}
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
                    slots: Array.from({ length: 100 }, (_, i) => ({
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

      {/* 🎡 스피드 룰렛 */}
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

          {/* 룰렛 */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: `conic-gradient(
                  #FF6B6B 0deg 36deg,
                  #4ECDC4 36deg 108deg,
                  #45B7D1 108deg 180deg,
                  #96CEB4 180deg 252deg,
                  #FFEAA7 252deg 360deg
                )`,
                margin: "0 auto 16px",
                position: "relative",
                border: "4px solid #333",
                transform: rouletteGame.isSpinning ? `rotate(${rouletteGame.currentAngle}deg)` : "rotate(0deg)",
                transition: rouletteGame.isSpinning ? "transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
              }}
            >
              {/* 룰렛 중앙 */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#333",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                {rouletteGame.selectedNumber || "?"}
              </div>
              
              {/* 룰렛 포인터 */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "0",
                  height: "0",
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "20px solid #333",
                }}
              />
            </div>

            {/* 배율 정보 */}
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                배율 정보
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {rouletteGame.multipliers.map((mult, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "4px 8px",
                      backgroundColor: mult.color,
                      borderRadius: "4px",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    <span>{mult.range[0]}-{mult.range[1]}번</span>
                    <span>{mult.multiplier}배</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 번호 선택 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              베팅할 번호 선택
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", marginBottom: "12px" }}>
              {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setRouletteGame(prev => ({ ...prev, userBet: num }))}
                  disabled={rouletteGame.isSpinning}
                  style={{
                    width: "32px",
                    height: "28px",
                    borderRadius: "4px",
                    border: rouletteGame.userBet === num ? `2px solid #ef4444` : `1px solid ${currentColors.border}`,
                    backgroundColor: rouletteGame.userBet === num ? "#ef4444" : currentColors.surface,
                    color: rouletteGame.userBet === num ? "white" : currentColors.text,
                    fontSize: "11px",
                    cursor: rouletteGame.isSpinning ? "not-allowed" : "pointer",
                    fontWeight: rouletteGame.userBet === num ? "bold" : "normal",
                    opacity: rouletteGame.isSpinning ? 0.6 : 1,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={startRouletteGame}
              disabled={rouletteGame.userBet === null || rouletteGame.isSpinning || (gameStats?.points || 0) < rouletteGame.cost}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: rouletteGame.userBet !== null && !rouletteGame.isSpinning && (gameStats?.points || 0) >= rouletteGame.cost ? "#ef4444" : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: rouletteGame.userBet !== null && !rouletteGame.isSpinning && (gameStats?.points || 0) >= rouletteGame.cost ? "pointer" : "not-allowed",
              }}
            >
              {rouletteGame.isSpinning ? "룰렛 회전 중..." : `🎡 룰렛 돌리기! (${safeFormatNumber(rouletteGame.cost)}P)`}
            </button>
          </div>

          {/* 게임 히스토리 */}
          {rouletteGame.spinHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                최근 게임 기록
              </h4>
              <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                {rouletteGame.spinHistory.map((history, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "8px",
                      backgroundColor: history.winnings > 0 ? currentColors.success : currentColors.gray,
                      borderRadius: "6px",
                      marginBottom: "4px",
                      border: history.winnings > 0 ? `1px solid ${currentColors.successBorder}` : `1px solid ${currentColors.grayBorder}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: currentColors.text }}>
                        베팅: {history.bet} → 결과: {history.result}
                      </span>
                      <span style={{ 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        color: history.winnings > 0 ? currentColors.successText : currentColors.textSecondary
                      }}>
                        {history.winnings > 0 ? `+${safeFormatNumber(history.winnings)}P` : "꽝"}
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                      {history.timestamp} | {history.multiplier}배율
                    </div>
                  </div>
                ))}
              </div>
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
};

export default MiniGame;
