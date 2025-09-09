import React, { useState, useEffect } from "react";
import LottoNumberBall from "../shared/LottoNumberBall";
import adMobManager from '../../utils/admobUtils';

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
    bonusMatch?: boolean;
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

interface RouletteGameState {
  isSpinning: boolean;
  currentAngle: number;
  targetAngle: number;
  selectedBetAmount: number | null;
  resultMultiplier: number;
  segments: Array<{
    multiplier: number;
    color: string;
    startAngle: number;
    endAngle: number;
    probability: number;
  }>;
  spinHistory: Array<{
    betAmount: number;
    resultMultiplier: number;
    winnings: number;
    timestamp: string;
  }>;
  betOptions: number[];
}

interface AdWatchState {
  isWatching: boolean;
  countdown: number;
  adTitle: string;
  adProgress: number;
  canSkip: boolean;
  isLoading: boolean;
  loadingMessage: string;
}

interface PopupState {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  confirmCallback?: () => void;
  cancelCallback?: () => void;
  isConfirm?: boolean;
}

const MiniGame: React.FC<MiniGameProps> = ({
  pastWinningNumbers = [],
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
}) => {
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

  const [gameStats, setGameStats] = useState<GameStats>(defaultGameStats);
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    message: '',
    type: 'info',
    isConfirm: false
  });

  const [adWatchState, setAdWatchState] = useState<AdWatchState>({
    isWatching: false,
    countdown: 30,
    adTitle: "",
    adProgress: 0,
    canSkip: false,
    isLoading: false,
    loadingMessage: "광고 로딩 중...",
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
    selectedBetAmount: null,
    resultMultiplier: -1,
    betOptions: [2000, 3000, 5000, 7000, 10000],
    segments: [
      { multiplier: 0, color: "#FFF5F5", startAngle: 0, endAngle: 45, probability: 0.35 },
      { multiplier: 2, color: "#FFF0F5", startAngle: 45, endAngle: 90, probability: 0.05 },
      { multiplier: 0, color: "#FFF5F5", startAngle: 90, endAngle: 135, probability: 0.35 },
      { multiplier: 5, color: "#FFF5F0", startAngle: 135, endAngle: 180, probability: 0.04 },
      { multiplier: 10, color: "#F5F5FF", startAngle: 180, endAngle: 225, probability: 0.03 },
      { multiplier: 12, color: "#FFF0F5", startAngle: 225, endAngle: 270, probability: 0.03 },
      { multiplier: 20, color: "#FFFAF0", startAngle: 270, endAngle: 315, probability: 0.02 },
      { multiplier: 0, color: "#FFF5F5", startAngle: 315, endAngle: 360, probability: 0.13 },
    ],
    spinHistory: [],
  });

  const safeFormatNumber = (value: any): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return "0";
    }
    return value.toLocaleString();
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
      adBg: "#1e3a8a",
      adBorder: "#3b82f6",
      adText: "#93c5fd",
      adButton: "#3b82f6",
    },
  };

  const currentColors = colors[theme] || colors.light;

  // 커스텀 팝업 표시 함수
  const showPopup = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setPopup({ isOpen: true, message, type, isConfirm: false });
  };

  // 확인취소 팝업 표시 함수
  const showConfirmPopup = (message: string, confirmCallback: () => void, cancelCallback?: () => void) => {
    setPopup({
      isOpen: true,
      message,
      type: 'info',
      isConfirm: true,
      confirmCallback,
      cancelCallback
    });
  };

  // 팝업 닫기 함수
  const closePopup = () => {
    setPopup({ isOpen: false, message: '', type: 'info', isConfirm: false });
  };

  // AdMob 디버그 정보 확인 (개발용)
  useEffect(() => {
    console.log('🎮 미니게임 AdMob 상태:', {
      isAndroid: adMobManager.isAndroid,
      rewardedReady: adMobManager.isRewardedReady()
    });
  }, []);

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
      desc: "포인트를 베팅하고 배수를 노려보세요!",
      emoji: "🎡",
      color: "#ef4444",
      difficulty: "중급",
      cost: 2000,
    },
  ];

  // 시뮬레이션 게임 함수들
  const startSimulation = () => {
    const currentPoints = gameStats?.points || 0;
    const cost = simulation.ticketPrice;
    
    if (currentPoints < cost) {
      showAdOfferDialog(cost, "가상 로또 시뮬레이션");
      return;
    }

    if (simulation.selectedNumbers.length !== 6) {
      showPopup("6개 번호를 먼저 선택해주세요!", "warning");
      return;
    }

    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) - cost,
      totalSpent: (prev?.totalSpent || 0) + cost,
    }));

    const winningNumbers = generateWinningNumbers();
    const bonusNumber = generateBonusNumber(winningNumbers);
    const matches = simulation.selectedNumbers.filter(num => winningNumbers.includes(num)).length;
    const bonusMatch = matches === 5 && simulation.selectedNumbers.includes(bonusNumber);
    const gradeResult = calculatePrize(matches, bonusMatch);

    const newResult = {
      round: simulation.currentRound + 1,
      userNumbers: [...simulation.selectedNumbers],
      winningNumbers,
      bonusNumber,
      matches,
      bonusMatch,
      grade: gradeResult.grade,
      prize: gradeResult.prize,
      spent: cost,
    };

    setSimulation(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      results: [newResult, ...prev.results].slice(0, 10),
      totalSpent: prev.totalSpent + cost,
      totalWon: prev.totalWon + gradeResult.prize,
    }));

    if (gradeResult.prize > 0) {
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) + gradeResult.prize,
        totalWon: (prev?.totalWon || 0) + gradeResult.prize,
        gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        totalWins: (prev?.totalWins || 0) + 1,
      }));
      setTimeout(() => showPopup(`🎉 ${gradeResult.grade} 당첨! ${safeFormatNumber(gradeResult.prize)}P 획득!`, "success"), 500);
    } else {
      setGameStats(prev => ({
        ...prev,
        gamesPlayed: (prev?.gamesPlayed || 0) + 1,
      }));
    }
  };

  const generateWinningNumbers = (): number[] => {
    if (pastWinningNumbers && pastWinningNumbers.length > 0) {
      const randomDraw = pastWinningNumbers[Math.floor(Math.random() * pastWinningNumbers.length)];
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

  const generateBonusNumber = (winningNumbers: number[]): number => {
    let bonus;
    do {
      bonus = Math.floor(Math.random() * 45) + 1;
    } while (winningNumbers.includes(bonus));
    return bonus;
  };

  const calculatePrize = (matches: number, bonusMatch: boolean = false): { grade: string; prize: number } => {
    if (matches === 6) {
      return { grade: "1등", prize: 1000000 };
    } else if (matches === 5 && bonusMatch) {
      return { grade: "2등", prize: 500000 };
    } else if (matches === 5) {
      return { grade: "3등", prize: 100000 };
    } else if (matches === 4) {
      return { grade: "4등", prize: 50000 };
    } else if (matches === 3) {
      return { grade: "5등", prize: 5000 };
    }
    return { grade: "꽝", prize: 0 };
  };

  const selectRandomSimNumbers = () => {
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    const randomNumbers = Array.from(numbers).sort((a, b) => a - b);
    setSimulation(prev => ({ ...prev, selectedNumbers: randomNumbers }));
  };

  // 뽑기판 게임 함수들
  const startDrawGame = () => {
    const currentPoints = gameStats?.points || 0;
    const cost = drawGame.cost;
    
    if (currentPoints < cost) {
      showAdOfferDialog(cost, "추억의 뽑기판");
      return;
    }

    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) - cost,
      totalSpent: (prev?.totalSpent || 0) + cost,
    }));

    setDrawGame(prev => ({ ...prev, isPlaying: true }));
  };

  const selectDrawSlot = (slotId: number) => {
    if (drawGame.selectedSlot !== null) return;

    const randomValue = Math.random();
    let selectedPrize = drawGame.prizes[drawGame.prizes.length - 1];
    
    let cumulativeProbability = 0;
    for (const prize of drawGame.prizes) {
      cumulativeProbability += prize.probability;
      if (randomValue <= cumulativeProbability) {
        selectedPrize = prize;
        break;
      }
    }

    const newSlots = drawGame.slots.map(slot => 
      slot.id === slotId 
        ? { ...slot, isRevealed: true, prize: selectedPrize, isWinner: selectedPrize.points > 0 }
        : slot
    );

    setDrawGame(prev => ({
      ...prev,
      selectedSlot: slotId,
      slots: newSlots,
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
  };

  const resetDrawGame = () => {
    setDrawGame(prev => ({
      ...prev,
      isPlaying: false,
      selectedSlot: null,
      hoveredSlot: null,
      result: null,
      slots: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        isRevealed: false,
        prize: null,
        isWinner: false,
      })),
    }));
  };

  // 룰렛 게임 함수들
  const getSegmentAtAngle = (angle: number): any => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    let sectionAngle = (270 + normalizedAngle) % 360;
    
    for (const segment of rouletteGame.segments) {
      if (sectionAngle >= segment.startAngle && sectionAngle < segment.endAngle) {
        return segment;
      }
      if (segment.startAngle > segment.endAngle) {
        if (sectionAngle >= segment.startAngle || sectionAngle < segment.endAngle) {
          return segment;
        }
      }
    }
    
    return rouletteGame.segments[0];
  };

  const startRouletteGame = () => {
    const currentPoints = gameStats?.points || 0;
    const betAmount = rouletteGame.selectedBetAmount;
    
    if (!betAmount) {
      showPopup("베팅 금액을 먼저 선택해주세요!", "warning");
      return;
    }

    if (currentPoints < betAmount) {
      showAdOfferDialog(betAmount, "스피드 룰렛");
      return;
    }

    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) - betAmount,
      totalSpent: (prev?.totalSpent || 0) + betAmount,
    }));

    const random = Math.random();
    const probTable = [
      { multiplier: 0, prob: 0.83 },
      { multiplier: 2, prob: 0.05 },
      { multiplier: 5, prob: 0.04 },
      { multiplier: 10, prob: 0.03 },
      { multiplier: 12, prob: 0.03 },
      { multiplier: 20, prob: 0.02 },
    ];
    
    let selectedMultiplier = 0;
    let cumProb = 0;
    
    for (const item of probTable) {
      cumProb += item.prob;
      if (random < cumProb) {
        selectedMultiplier = item.multiplier;
        break;
      }
    }
    
    const matchingSegments = rouletteGame.segments.filter(s => s.multiplier === selectedMultiplier);
    const targetSegment = matchingSegments[Math.floor(Math.random() * matchingSegments.length)];
    
    const targetAngle = (targetSegment.startAngle + targetSegment.endAngle) / 2;
    const baseSpins = 5 + Math.floor(Math.random() * 5);
    const currentAngle = rouletteGame.currentAngle % 360;
    
    let neededRotation = (270 - targetAngle + 720) % 360;
    let additionalRotation = neededRotation - (currentAngle % 360);
    while (additionalRotation < 0) {
      additionalRotation += 360;
    }
    
    const totalRotation = baseSpins * 360 + additionalRotation;
    const finalAngle = currentAngle + totalRotation;
    
    const winnings = betAmount * selectedMultiplier;
    
    setRouletteGame(prev => ({
      ...prev,
      isSpinning: true,
      targetAngle: finalAngle,
      resultMultiplier: -1,
    }));

    setTimeout(() => {
      const newHistory = {
        betAmount: betAmount,
        resultMultiplier: selectedMultiplier,
        winnings,
        timestamp: new Date().toLocaleTimeString(),
      };

      setRouletteGame(prev => ({
        ...prev,
        isSpinning: false,
        currentAngle: finalAngle % 360,
        resultMultiplier: selectedMultiplier,
        spinHistory: [newHistory, ...prev.spinHistory].slice(0, 5),
      }));

      if (winnings > 0) {
        setGameStats(prev => ({
          ...prev,
          points: (prev?.points || 0) + winnings,
          totalWon: (prev?.totalWon || 0) + winnings,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
        }));
        setTimeout(() => showPopup(`🎉 축하합니다! ${selectedMultiplier}배 당첨! ${safeFormatNumber(winnings)}P 획득!`, "success"), 100);
      } else {
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        }));
        setTimeout(() => showPopup(`😢 아쉽게 꽝! 다음 기회에 도전하세요!`, "error"), 100);
      }
    }, 8000);
  };

  // 광고 및 포인트 관련 함수들 (AdMob 연동 수정)
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

  // AdMob 보상형 광고 시청 (수정됨)
  const startAdWatch = async () => {
    if (!checkDailyAdLimit()) {
      showPopup("😅 오늘 광고 시청 횟수를 모두 사용했어요! 내일 다시 이용해주세요.", "warning");
      return;
    }

    try {
      // 광고 로딩 상태 표시
      setAdWatchState({
        isWatching: false,
        countdown: 30,
        adTitle: "",
        adProgress: 0,
        canSkip: false,
        isLoading: true,
        loadingMessage: "보상형 광고 로딩 중...",
      });

      // AdMob Manager를 통한 보상형 광고 표시
      const result = await adMobManager.showRewardedAd();
      
      if (result.earned) {
        // 보상 지급
        const adPoints = result.amount || 3000;
        completeAdWatch(adPoints);
      } else {
        // 광고를 끝까지 보지 않음
        setAdWatchState({
          isWatching: false,
          countdown: 30,
          adTitle: "",
          adProgress: 0,
          canSkip: false,
          isLoading: false,
          loadingMessage: "",
        });
        showPopup("광고를 끝까지 시청해야 포인트를 받을 수 있습니다.", "warning");
      }
    } catch (error) {
      console.error('광고 로드/표시 실패:', error);
      
      setAdWatchState({
        isWatching: false,
        countdown: 30,
        adTitle: "",
        adProgress: 0,
        canSkip: false,
        isLoading: false,
        loadingMessage: "",
      });

      showPopup("광고를 로드할 수 없습니다. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  // 광고 시청 완료
  const completeAdWatch = (adPoints: number = 3000) => {
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
      isLoading: false,
      loadingMessage: "",
    });

    const remaining = 10 - ((gameStats.dailyAdWatchDate === today ? gameStats.dailyAdWatchCount || 0 : 0) + 1);
    showPopup(`🎉 광고 시청 완료! ${safeFormatNumber(adPoints)}P 획득! 오늘 ${remaining}번 더 시청 가능합니다.`, "success");
  };

  // 광고 건너뛰기
  const skipAd = () => {
    setAdWatchState({
      isWatching: false,
      countdown: 30,
      adTitle: "",
      adProgress: 0,
      canSkip: false,
      isLoading: false,
      loadingMessage: "",
    });
  };

  const showAdOfferDialog = (requiredPoints: number, gameName: string) => {
    const currentPoints = gameStats?.points || 0;
    const shortage = requiredPoints - currentPoints;
    
    if (checkDailyAdLimit()) {
      showConfirmPopup(
        `포인트가 ${safeFormatNumber(shortage)}P 부족합니다. 보상형 광고를 시청하여 3,000P를 받으시겠습니까?`,
        () => {
          startAdWatch();
        }
      );
    } else {
      showPopup("😅 오늘 광고 시청 횟수를 모두 사용했어요!", "warning");
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
      showPopup(`🎁 일일 보너스 ${safeFormatNumber(bonusPoints)}P 지급! 내일 또 받으세요!`, "success");
    } else {
      showPopup("😊 오늘은 이미 보너스를 받았어요. 내일 다시 오세요!", "info");
    }
  };

  const chargePoints = () => {
    if (!checkDailyLimit('charge')) {
      showPopup("😅 오늘 충전 횟수를 모두 사용했어요! 내일 다시 이용해주세요.", "warning");
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
    showPopup(`💎 ${safeFormatNumber(chargeAmount)}P 충전 완료! 오늘 ${remaining}번 더 충전 가능합니다.`, "success");
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
      showPopup("6개 번호를 모두 선택해주세요!", "warning");
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
        setTimeout(() => showPopup(`🎉 축하합니다! ${safeFormatNumber(prize)}P 상금을 획득했습니다!`, "success"), 500);
      } else {
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
        }));
        setTimeout(() => showPopup(`😢 게임 종료! 정답: ${guessGame.secretNumbers.join(", ")}`, "error"), 500);
      }
    }
  };

  if (isDataLoading) {
    return (
      <div style={{ 
        padding: "12px",
        backgroundColor: currentColors.background,
        minHeight: "100vh",
        color: currentColors.text
      }}>
        <div style={{
          backgroundColor: currentColors.surface,
          padding: "32px 16px",
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
          textAlign: "center",
        }}>
          <p style={{ color: currentColors.textSecondary, margin: "0", fontSize: "14px" }}>
            🎮 미니게임 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!pastWinningNumbers || pastWinningNumbers.length === 0) {
    return (
      <div style={{ 
        padding: "12px",
        backgroundColor: currentColors.background,
        minHeight: "100vh",
        color: currentColors.text
      }}>
        <div style={{
          backgroundColor: currentColors.surface,
          padding: "32px 16px",
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
          textAlign: "center",
        }}>
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
    <div style={{ 
      padding: "12px",
      backgroundColor: currentColors.background,
      minHeight: "100vh",
      color: currentColors.text
    }}>
      {/* 커스텀 팝업 */}
      {popup.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            backgroundColor: currentColors.surface,
            borderRadius: "12px",
            padding: "24px",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            border: `2px solid ${
              popup.type === 'success' ? currentColors.successBorder :
              popup.type === 'error' ? currentColors.errorBorder :
              popup.type === 'warning' ? currentColors.warningBorder :
              currentColors.infoBorder
            }`,
            animation: "slideIn 0.3s ease-out",
          }}>
            <div style={{
              fontSize: "48px",
              textAlign: "center",
              marginBottom: "16px",
            }}>
              {popup.type === 'success' ? '🎉' :
               popup.type === 'error' ? '😢' :
               popup.type === 'warning' ? '⚠️' :
               '💡'}
            </div>
            <p style={{
              fontSize: "16px",
              textAlign: "center",
              color: currentColors.text,
              margin: "0 0 20px 0",
              lineHeight: "1.5",
            }}>
              {popup.message}
            </p>
            <div style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
            }}>
              {popup.isConfirm ? (
                <>
                  <button
                    onClick={() => {
                      if (popup.confirmCallback) popup.confirmCallback();
                      closePopup();
                    }}
                    style={{
                      padding: "10px 24px",
                      backgroundColor: currentColors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    확인
                  </button>
                  <button
                    onClick={() => {
                      if (popup.cancelCallback) popup.cancelCallback();
                      closePopup();
                    }}
                    style={{
                      padding: "10px 24px",
                      backgroundColor: currentColors.textSecondary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={closePopup}
                  style={{
                    padding: "10px 32px",
                    backgroundColor: currentColors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 보상형 광고 로딩 모달 (AdMob 표시 중) */}
      {adWatchState.isLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            backgroundColor: currentColors.surface,
            borderRadius: "12px",
            padding: "24px",
            width: "90%",
            maxWidth: "400px",
            border: `2px solid ${currentColors.adBorder}`,
            textAlign: "center",
          }}>
            <div style={{ 
              fontSize: "48px", 
              marginBottom: "16px",
              animation: "pulse 1.5s infinite"
            }}>
              📺
            </div>
            <h3 style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 8px 0",
            }}>
              {adWatchState.loadingMessage}
            </h3>
            <p style={{
              fontSize: "12px",
              color: currentColors.textSecondary,
              margin: "0",
            }}>
              잠시만 기다려주세요...
            </p>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: currentColors.surface,
        padding: "16px",
        borderRadius: "12px",
        border: `1px solid ${currentColors.border}`,
        marginBottom: "12px",
      }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: currentColors.text,
          margin: "0 0 8px 0",
        }}>
          🎮 프리미엄 게임센터
        </h2>
        <p style={{
          fontSize: "14px",
          color: currentColors.textSecondary,
          margin: "0 0 16px 0",
        }}>
          업그레이드된 인터랙티브 게임으로 포인트를 모아보세요!
        </p>

        <div style={{
          backgroundColor: currentColors.success,
          padding: "16px",
          borderRadius: "8px",
          border: `1px solid ${currentColors.successBorder}`,
          marginBottom: "12px",
          textAlign: "center",
        }}>
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
              disabled={!checkDailyAdLimit() || adWatchState.isLoading}
              style={{
                padding: "8px 12px",
                backgroundColor: (checkDailyAdLimit() && !adWatchState.isLoading) ? "#ef4444" : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: (checkDailyAdLimit() && !adWatchState.isLoading) ? "pointer" : "not-allowed",
                fontWeight: "bold",
                opacity: (checkDailyAdLimit() && !adWatchState.isLoading) ? 1 : 0.6,
              }}
            >
              📺 보상형광고 3000P
            </button>
          </div>
        </div>
      </div>

      {!selectedGame && (
        <div style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: currentColors.text,
            margin: "0 0 12px 0",
          }}>
            🎯 게임 선택
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                style={{
                  padding: "16px 8px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.border}`,
                  backgroundColor: currentColors.surface,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>{game.emoji}</div>
                <h4 style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: currentColors.text,
                  margin: "0 0 4px 0",
                }}>
                  {game.name}
                </h4>
                <p style={{
                  fontSize: "11px",
                  color: currentColors.textSecondary,
                  margin: "0 0 6px 0",
                  lineHeight: "1.3",
                }}>
                  {game.desc}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <span style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    backgroundColor: game.color,
                    color: "white",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}>
                    {safeFormatNumber(game.cost)}P
                  </span>
                  <span style={{
                    fontSize: "9px",
                    color: currentColors.textSecondary,
                  }}>
                    {game.difficulty}
                  </span>
                </div>
                {(gameStats?.points || 0) < game.cost && (
                  <div style={{
                    fontSize: "9px",
                    color: "#ef4444",
                    marginTop: "4px",
                    fontWeight: "bold",
                  }}>
                    📺 보상형 광고로 포인트 획득 가능
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedGame === "simulation" && (
        <div style={{
          backgroundColor: currentColors.surface,
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${currentColors.border}`,
        }}>
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

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0" }}>
                번호 선택 (6개)
              </h4>
              <button
                onClick={selectRandomSimNumbers}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
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
                    const newSelection = [...simulation.selectedNumbers];
                    if (newSelection.includes(num)) {
                      const index = newSelection.indexOf(num);
                      newSelection.splice(index, 1);
                    } else if (newSelection.length < 6) {
                      newSelection.push(num);
                    }
                    setSimulation(prev => ({ ...prev, selectedNumbers: newSelection.sort((a, b) => a - b) }));
                  }}
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
              disabled={simulation.selectedNumbers.length !== 6 || (gameStats?.points || 0) < simulation.ticketPrice}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: simulation.selectedNumbers.length === 6 && (gameStats?.points || 0) >= simulation.ticketPrice ? currentColors.accent : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: simulation.selectedNumbers.length === 6 && (gameStats?.points || 0) >= simulation.ticketPrice ? "pointer" : "not-allowed",
              }}
            >
              🎲 로또 구매! ({safeFormatNumber(simulation.ticketPrice)}P)
            </button>
          </div>

          <div style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: currentColors.info,
            borderRadius: "8px",
            border: `1px solid ${currentColors.infoBorder}`,
          }}>
            <h5 style={{ fontSize: "12px", fontWeight: "bold", color: currentColors.infoText, margin: "0 0 8px 0" }}>
              📋 당첨 규칙
            </h5>
            <div style={{ fontSize: "11px", color: currentColors.infoText, lineHeight: "1.6" }}>
              <div>🥇 <strong>1등</strong>: 6개 번호 일치 - 1,000,000P</div>
              <div>🥈 <strong>2등</strong>: 5개 번호 + 보너스 번호 일치 - 500,000P</div>
              <div>🥉 <strong>3등</strong>: 5개 번호 일치 - 100,000P</div>
              <div>🏅 <strong>4등</strong>: 4개 번호 일치 - 50,000P</div>
              <div>🎖️ <strong>5등</strong>: 3개 번호 일치 - 5,000P</div>
              <div style={{ marginTop: "4px", opacity: 0.8 }}>
                ※ 실제 로또와 동일한 규칙으로 진행됩니다
              </div>
            </div>
          </div>

          {simulation.results.length > 0 && (
            <div>
              <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                최근 결과 (최대 10회)
              </h4>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {simulation.results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      backgroundColor: result.prize > 0 ? currentColors.success : currentColors.gray,
                      borderRadius: "6px",
                      marginBottom: "8px",
                      border: result.prize > 0 ? `1px solid ${currentColors.successBorder}` : `1px solid ${currentColors.grayBorder}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
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
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", color: currentColors.textSecondary }}>내 번호:</span>
                      {result.userNumbers.map((num, i) => (
                        <span key={i} style={{ 
                          fontSize: "10px", 
                          padding: "2px 4px", 
                          backgroundColor: currentColors.primary, 
                          color: "white", 
                          borderRadius: "3px" 
                        }}>
                          {num}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <span style={{ fontSize: "10px", color: currentColors.textSecondary }}>당첨:</span>
                      {result.winningNumbers.map((num, i) => (
                        <span key={i} style={{ 
                          fontSize: "10px", 
                          padding: "2px 4px", 
                          backgroundColor: result.userNumbers.includes(num) ? "#10b981" : currentColors.textSecondary, 
                          color: "white", 
                          borderRadius: "3px" 
                        }}>
                          {num}
                        </span>
                      ))}
                      <span style={{ 
                        fontSize: "10px", 
                        padding: "2px 4px", 
                        backgroundColor: "#f59e0b", 
                        color: "white", 
                        borderRadius: "3px" 
                      }}>
                        +{result.bonusNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedGame === "guess" && (
        <div style={{
          backgroundColor: currentColors.surface,
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${currentColors.border}`,
        }}>
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

      {selectedGame === "draw" && (
        <div style={{
          backgroundColor: currentColors.surface,
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${currentColors.border}`,
        }}>
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

          {!drawGame.isPlaying ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎪</div>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", color: currentColors.text, margin: "0 0 8px 0" }}>
                추억의 뽑기판
              </h4>
              <p style={{ color: currentColors.textSecondary, margin: "0 0 16px 0", fontSize: "14px" }}>
                100개 칸 중 하나를 선택해서 상품을 뽑아보세요!
              </p>
              
              <div style={{ marginBottom: "16px", backgroundColor: currentColors.gray, padding: "12px", borderRadius: "8px" }}>
                <h5 style={{ fontSize: "12px", color: currentColors.text, margin: "0 0 8px 0" }}>상품 확률</h5>
                {drawGame.prizes.map((prize, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                    <span style={{ color: currentColors.textSecondary }}>
                      {prize.emoji} {prize.name}
                    </span>
                    <span style={{ color: currentColors.text, fontWeight: "bold" }}>
                      {(prize.probability * 100).toFixed(1)}% ({safeFormatNumber(prize.points)}P)
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={startDrawGame}
                disabled={(gameStats?.points || 0) < drawGame.cost}
                style={{
                  padding: "16px 24px",
                  backgroundColor: (gameStats?.points || 0) >= drawGame.cost ? currentColors.primary : currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: (gameStats?.points || 0) >= drawGame.cost ? "pointer" : "not-allowed",
                }}
              >
                🎪 뽑기 시작! ({safeFormatNumber(drawGame.cost)}P)
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <h4 style={{ fontSize: "16px", color: currentColors.text, margin: "0 0 8px 0" }}>
                  원하는 칸을 선택하세요!
                </h4>
                <p style={{ fontSize: "12px", color: currentColors.textSecondary, margin: "0" }}>
                  {drawGame.selectedSlot !== null ? "결과를 확인하세요!" : "100개 칸 중 하나를 클릭하세요"}
                </p>
              </div>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(10, 1fr)", 
                gap: "3px", 
                marginBottom: "16px",
              }}>
                {drawGame.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => selectDrawSlot(slot.id)}
                    disabled={drawGame.selectedSlot !== null}
                    onMouseEnter={() => setDrawGame(prev => ({ ...prev, hoveredSlot: slot.id }))}
                    onMouseLeave={() => setDrawGame(prev => ({ ...prev, hoveredSlot: null }))}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      border: slot.isRevealed 
                        ? `2px solid ${slot.isWinner ? "#ffd700" : "#ef4444"}`
                        : `1px solid #333`,
                      backgroundColor: slot.isRevealed 
                        ? (slot.isWinner ? "#ffd700" : "#ef4444")
                        : (drawGame.hoveredSlot === slot.id ? "#333" : "#000"),
                      color: slot.isRevealed 
                        ? "#000" 
                        : (drawGame.hoveredSlot === slot.id ? "#ffd700" : "#ffd700"),
                      fontSize: slot.isRevealed ? "10px" : "12px",
                      cursor: drawGame.selectedSlot !== null ? "not-allowed" : "pointer",
                      fontWeight: slot.isRevealed ? "bold" : "normal",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {slot.isRevealed ? slot.prize?.emoji : "⭐"}
                  </button>
                ))}
              </div>

              {drawGame.result && (
                <div style={{ 
                  textAlign: "center",
                  padding: "16px",
                  backgroundColor: drawGame.result.points > 0 ? currentColors.success : currentColors.error,
                  borderRadius: "8px",
                  marginBottom: "12px",
                  border: `2px solid ${drawGame.result.points > 0 ? "#ffd700" : "#ef4444"}`,
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                    {drawGame.result.emoji}
                  </div>
                  <h4 style={{ 
                    fontSize: "18px", 
                    fontWeight: "bold", 
                    color: drawGame.result.points > 0 ? currentColors.successText : currentColors.errorText,
                    margin: "0 0 8px 0"
                  }}>
                    {drawGame.result.name}
                  </h4>
                  <p style={{
                    color: drawGame.result.points > 0 ? currentColors.successText : currentColors.errorText,
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}>
                    {drawGame.result.points > 0 ? `🎉 ${safeFormatNumber(drawGame.result.points)}P 획득!` : "😅 다음에 도전해보세요!"}
                  </p>
                  <button
                    onClick={resetDrawGame}
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

      {selectedGame === "roulette" && (
        <div style={{
          backgroundColor: currentColors.surface,
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${currentColors.border}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "500", color: currentColors.text, margin: "0" }}>
              🎡 스피드 룰렛
            </h3>
            <button
              onClick={() => setSelectedGame(null)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#F5F5F5",
                color: "#666",
                border: "1px solid #E0E0E0",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: "normal",
              }}
            >
              게임 선택으로
            </button>
          </div>

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{
              width: "260px",
              height: "260px",
              margin: "0 auto 16px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                top: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderTop: "24px solid #FF9999",
                zIndex: 10,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              }} />
              
              <svg
                width="260"
                height="260"
                style={{
                  transform: `rotate(${rouletteGame.targetAngle || rouletteGame.currentAngle}deg)`,
                  transformOrigin: "130px 130px",
                  transition: rouletteGame.isSpinning ? "transform 8s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "transform 0.5s ease-out",
                  willChange: "transform",
                }}
              >
                <circle
                  cx="130"
                  cy="130"
                  r="125"
                  fill="#D4A574"
                  opacity="0.3"
                />
                <circle
                  cx="130"
                  cy="130"
                  r="120"
                  fill="white"
                />
                {rouletteGame.segments.map((segment, index) => {
                  const centerX = 130;
                  const centerY = 130;
                  const radius = 120;
                  
                  const startAngleRad = (segment.startAngle * Math.PI) / 180;
                  const endAngleRad = (segment.endAngle * Math.PI) / 180;
                  
                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  const textAngle = (segment.startAngle + segment.endAngle) / 2;
                  const textRadius = 75;
                  const textX = centerX + textRadius * Math.cos((textAngle * Math.PI) / 180);
                  const textY = centerY + textRadius * Math.sin((textAngle * Math.PI) / 180);
                  
                  return (
                    <g key={index}>
                      <path
                        d={pathData}
                        fill={segment.color}
                        stroke="#E0E0E0"
                        strokeWidth="1"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={segment.multiplier === 0 ? "#B0B0B0" : "#666"}
                        fontSize="14"
                        fontWeight="normal"
                        style={{ userSelect: "none" }}
                      >
                        {segment.multiplier === 0 ? "꽝" : `×${segment.multiplier}`}
                      </text>
                    </g>
                  );
                })}
                
                {Array.from({ length: 16 }, (_, i) => {
                  const angle = (i * 22.5 * Math.PI) / 180;
                  const dotX = 130 + 115 * Math.cos(angle);
                  const dotY = 130 + 115 * Math.sin(angle);
                  return (
                    <circle
                      key={`dot-${i}`}
                      cx={dotX}
                      cy={dotY}
                      r="2"
                      fill="#F0C0A0"
                    />
                  );
                })}
                
                <g 
                  onClick={startRouletteGame}
                  style={{ cursor: rouletteGame.isSpinning || !rouletteGame.selectedBetAmount ? "not-allowed" : "pointer" }}
                >
                  <circle
                    cx="130"
                    cy="130"
                    r="40"
                    fill="#F5F5F5"
                    stroke="#DDD"
                    strokeWidth="1"
                  />
                  <circle
                    cx="130"
                    cy="130"
                    r="35"
                    fill={rouletteGame.isSpinning ? "#E8E8E8" : "#FAFAFA"}
                    stroke="#E0E0E0"
                    strokeWidth="1"
                  />
                  <text
                    x="130"
                    y="130"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#888"
                    fontSize="14"
                    fontWeight="normal"
                    pointerEvents="none"
                  >
                    {rouletteGame.isSpinning ? "SPIN" : "START"}
                  </text>
                </g>
              </svg>

              {!rouletteGame.isSpinning && rouletteGame.resultMultiplier >= 0 && (
                <div style={{ 
                  marginTop: "16px",
                  textAlign: "center",
                }}>
                  <div style={{ 
                    fontSize: "16px", 
                    fontWeight: "normal", 
                    color: currentColors.text, 
                    marginBottom: "4px",
                  }}>
                    결과: {rouletteGame.resultMultiplier === 0 ? "꽝 😢" : `×${rouletteGame.resultMultiplier} 당첨! 🎉`}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "13px", color: currentColors.text, margin: "0 0 12px 0" }}>
              베팅 금액 선택
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
              {rouletteGame.betOptions.map((amount) => {
                const isSelected = rouletteGame.selectedBetAmount === amount;
                const canAfford = (gameStats?.points || 0) >= amount;
                return (
                  <button
                    key={amount}
                    onClick={() => setRouletteGame(prev => ({ ...prev, selectedBetAmount: amount }))}
                    disabled={rouletteGame.isSpinning || !canAfford}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: isSelected ? `2px solid #FF9999` : `1px solid #E0E0E0`,
                      backgroundColor: isSelected 
                        ? "#FFF0F0" 
                        : canAfford 
                          ? "#FAFAFA" 
                          : "#F5F5F5",
                      color: isSelected ? "#FF6666" : canAfford ? "#666" : "#CCC",
                      fontSize: "13px",
                      cursor: rouletteGame.isSpinning || !canAfford ? "not-allowed" : "pointer",
                      fontWeight: isSelected ? "500" : "normal",
                      textAlign: "center",
                      opacity: canAfford ? 1 : 0.6,
                      transition: "all 0.2s",
                    }}
                  >
                    {safeFormatNumber(amount)}P
                  </button>
                );
              })}
            </div>

            {rouletteGame.selectedBetAmount && (
              <div style={{ 
                padding: "12px", 
                backgroundColor: "#F5F5FF", 
                borderRadius: "8px", 
                marginBottom: "16px",
                textAlign: "center",
                border: `1px solid #E0E0F0`,
              }}>
                <span style={{ fontSize: "13px", color: "#666", fontWeight: "normal" }}>
                  베팅 금액: {safeFormatNumber(rouletteGame.selectedBetAmount)}P
                </span>
                <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                  중앙 START 버튼을 눌러주세요!
                </div>
              </div>
            )}
          </div>

          {rouletteGame.spinHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: "13px", color: currentColors.text, margin: "0 0 8px 0" }}>
                최근 결과
              </h4>
              <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                {rouletteGame.spinHistory.map((history, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "8px",
                      backgroundColor: history.winnings > 0 ? "#F0FFF0" : "#FFF5F5",
                      borderRadius: "6px",
                      marginBottom: "6px",
                      fontSize: "11px",
                      color: "#666",
                      border: `1px solid ${history.winnings > 0 ? "#E0F0E0" : "#F0E0E0"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span>
                        베팅: {safeFormatNumber(history.betAmount)}P
                      </span>
                      <span style={{ color: history.winnings > 0 ? "#66BB66" : "#BB6666" }}>
                        {history.winnings > 0 ? `+${safeFormatNumber(history.winnings)}P` : "꽝"}
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#999" }}>
                      {history.timestamp} | {history.resultMultiplier === 0 ? "꽝" : `×${history.resultMultiplier}배`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
              box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
              transform: scale(1.02);
            }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default MiniGame;

