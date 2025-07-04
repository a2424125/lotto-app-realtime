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
  dailyChargeCount?: number; // 🆕 일일 충전 횟수
  dailyChargeDate?: string; // 🆕 일일 충전 날짜
  dailyAdCount?: number; // 🆕 일일 광고 시청 횟수
  dailyAdDate?: string; // 🆕 일일 광고 날짜
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
  
  // ✅ 🆕 업그레이드된 기본값 (10만원 시작, 비용 상승)
  const defaultGameStats: GameStats = {
    gamesPlayed: 0,
    bestScore: 0,
    totalWins: 0,
    points: 100000, // 🆕 10만원 시작!
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
          points: typeof parsed.points === 'number' ? parsed.points : 100000, // 🆕 10만원 기본값
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
    cost: 200, // 🆕 50P → 200P
  });

  // 가상 로또 시뮬레이션 상태
  const [simulation, setSimulation] = useState({
    selectedNumbers: [] as number[],
    ticketPrice: 300, // 🆕 100P → 300P
    currentRound: 0,
    results: [] as any[],
    isPlaying: false,
    autoPlay: false,
    speed: 1,
  });

  // 🆕 업그레이드된 추억의 뽑기 게임 상태 (인터랙티브)
  const [drawGame, setDrawGame] = useState({
    isPlaying: false,
    isShaking: false, // 🆕 뽑기 머신 흔들기
    ballPosition: { x: 50, y: 50, color: 'gold' as string }, // 🆕 공 위치와 색상
    selectedBall: null as any, // 🆕 선택된 공
    result: null as any,
    cost: 150, // 🆕 30P → 150P
    prizes: [
      { name: "💎 다이아몬드!", points: 2000, probability: 0.005, emoji: "💎", rarity: "legendary" },
      { name: "🏆 대박!", points: 1000, probability: 0.01, emoji: "🏆", rarity: "epic" },
      { name: "🎉 잭팟!", points: 500, probability: 0.03, emoji: "🎉", rarity: "rare" },
      { name: "✨ 당첨!", points: 200, probability: 0.1, emoji: "✨", rarity: "uncommon" },
      { name: "🎁 성공!", points: 100, probability: 0.15, emoji: "🎁", rarity: "common" },
      { name: "😅 꽝", points: 0, probability: 0.705, emoji: "😅", rarity: "common" },
    ],
    machineAnimation: false, // 🆕 머신 애니메이션
  });

  // 🆕 업그레이드된 행운의 번호 생성기 상태 (액션감 추가)
  const [luckyGame, setLuckyGame] = useState({
    isGenerating: false,
    generatedNumbers: [] as number[],
    cost: 250, // 🆕 20P → 250P
    method: "crystal" as "crystal" | "tarot" | "zodiac" | "animal",
    animationPhase: "idle" as "idle" | "charging" | "casting" | "revealing", // 🆕 애니메이션 단계
    crystalPower: 0, // 🆕 수정구슬 파워
    cardAnimation: false, // 🆕 카드 애니메이션
    methods: [
      { id: "crystal", name: "🔮 신비한 수정구슬", desc: "고대 마법사의 수정구슬로 운명 예언", powerLevel: 95 },
      { id: "tarot", name: "🃏 타로 카드 점술", desc: "신비한 타로 카드가 펼치는 운명의 계시", powerLevel: 88 },
      { id: "zodiac", name: "⭐ 별자리 운세", desc: "12별자리가 전하는 우주의 메시지", powerLevel: 85 },
      { id: "animal", name: "🐉 십이지신 점괘", desc: "동양 십이지신의 신성한 계시", powerLevel: 90 },
    ],
  });

  // 🆕 광고 시청 상태
  const [adState, setAdState] = useState({
    isWatching: false,
    progress: 0,
    canWatchAd: true,
  });

  // 실제 회차 범위 정보 사용
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers?.length || 0;

  // ✅ 안전한 숫자 포맷팅 함수
  const safeFormatNumber = (value: any): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return "0";
    }
    return value.toLocaleString();
  };

  // ✅ 안전한 계산 함수  
  const safeCalculatePercentage = (won: any, spent: any): string => {
    const safeWon = typeof won === 'number' ? won : 0;
    const safeSpent = typeof spent === 'number' ? spent : 0;
    
    if (safeSpent <= 0) return "0";
    
    const percentage = ((safeWon - safeSpent) / safeSpent) * 100;
    return isNaN(percentage) ? "0" : percentage.toFixed(1);
  };

  // ✅ 다크 모드 색상 테마
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

  // 🆕 업데이트된 게임 목록 (비용 인상)
  const games = [
    {
      id: "guess",
      name: "번호맞추기",
      desc: "AI 비밀번호를 힌트로 맞춰보세요!",
      emoji: "🎯",
      color: currentColors.primary,
      difficulty: "중급",
      cost: 200, // 50P → 200P
    },
    {
      id: "simulation",
      name: "가상 로또 시뮬",
      desc: "포인트로 로또를 사서 결과를 확인해보세요!",
      emoji: "🎲",
      color: "#8b5cf6",
      difficulty: "초급",
      cost: 300, // 100P → 300P
    },
    {
      id: "draw",
      name: "추억의 뽑기머신",
      desc: "직접 뽑는 재미! 레어 아이템을 노려보세요!",
      emoji: "🎰",
      color: "#f59e0b",
      difficulty: "초급",
      cost: 150, // 30P → 150P
    },
    {
      id: "lucky",
      name: "신비한 점술소",
      desc: "마법사의 수정구슬로 운명의 번호를 알아보세요!",
      emoji: "🔮",
      color: "#8b5cf6",
      difficulty: "쉬움",
      cost: 250, // 20P → 250P
    },
  ];

  // ✅ 안전한 useEffect
  useEffect(() => {
    try {
      console.log("🎮 MiniGame useEffect 실행");
      localStorage.setItem("lotto-game-stats", JSON.stringify(gameStats));
    } catch (error) {
      console.error("게임 통계 저장 실패:", error);
    }
  }, [gameStats]);

  // 🆕 일일 제한 확인 함수
  const checkDailyLimit = (type: 'charge' | 'ad'): boolean => {
    const today = new Date().toDateString();
    
    if (type === 'charge') {
      const maxCharge = 3; // 하루 3번 충전 제한
      return gameStats.dailyChargeDate !== today || (gameStats.dailyChargeCount || 0) < maxCharge;
    } else {
      const maxAd = 10; // 하루 10번 광고 제한
      return gameStats.dailyAdDate !== today || (gameStats.dailyAdCount || 0) < maxAd;
    }
  };

  // 🎁 일일 보너스 포인트 지급
  const claimDailyBonus = () => {
    const today = new Date().toDateString();
    if (gameStats.dailyBonusDate !== today) {
      const bonusPoints = 500; // 🆕 100P → 500P
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

  // 💎 포인트 충전 (일일 제한)
  const chargePoints = () => {
    if (!checkDailyLimit('charge')) {
      alert("😅 오늘 충전 횟수를 모두 사용했어요! 내일 다시 이용해주세요.");
      return;
    }

    const chargeAmount = 1000; // 🆕 500P → 1000P
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

  // 🆕 광고 시청으로 포인트 충전
  const watchAdForPoints = () => {
    if (!checkDailyLimit('ad')) {
      alert("😅 오늘 광고 시청 횟수를 모두 사용했어요! 내일 다시 이용해주세요.");
      return;
    }

    setAdState(prev => ({ ...prev, isWatching: true, progress: 0 }));

    // 30초 광고 시뮬레이션
    const adDuration = 30000; // 30초
    const updateInterval = 100; // 0.1초마다 업데이트
    let currentProgress = 0;

    const adInterval = setInterval(() => {
      currentProgress += (updateInterval / adDuration) * 100;
      setAdState(prev => ({ ...prev, progress: currentProgress }));

      if (currentProgress >= 100) {
        clearInterval(adInterval);
        
        // 광고 완료 - 포인트 지급
        const adPoints = 300; // 광고 1회당 300P
        const today = new Date().toDateString();
        
        setGameStats(prev => ({
          ...prev,
          points: (prev?.points || 0) + adPoints,
          dailyAdCount: prev.dailyAdDate === today ? (prev.dailyAdCount || 0) + 1 : 1,
          dailyAdDate: today,
        }));

        setAdState({ isWatching: false, progress: 0, canWatchAd: true });
        
        const remaining = 10 - ((gameStats.dailyAdDate === today ? gameStats.dailyAdCount || 0 : 0) + 1);
        alert(`📺 광고 시청 완료! ${safeFormatNumber(adPoints)}P 획득! 오늘 ${remaining}번 더 시청 가능합니다.`);
      }
    }, updateInterval);
  };

  // 🆕 업그레이드된 추억의 뽑기 게임 시작 (인터랙티브)
  const startInteractiveDrawGame = () => {
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

      // 🎰 뽑기 머신 애니메이션 시작
      setDrawGame(prev => ({ 
        ...prev, 
        isPlaying: true,
        machineAnimation: true,
        isShaking: false,
        selectedBall: null,
        result: null
      }));

      // 3초간 머신 작동 애니메이션
      setTimeout(() => {
        setDrawGame(prev => ({ ...prev, isShaking: true }));
      }, 500);

      // 2초간 흔들기
      setTimeout(() => {
        // 랜덤 공 선택 애니메이션
        let ballCount = 0;
        const ballInterval = setInterval(() => {
          ballCount++;
          const colors = ['red', 'blue', 'gold', 'purple', 'green'];
          const randomBall = {
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20,
            color: colors[Math.floor(Math.random() * colors.length)]
          };
          setDrawGame(prev => ({ ...prev, ballPosition: randomBall }));

          if (ballCount >= 10) {
            clearInterval(ballInterval);
            
            // 최종 결과 결정
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

              setDrawGame(prev => ({
                ...prev,
                isPlaying: false,
                machineAnimation: false,
                isShaking: false,
                result: selectedPrize,
                selectedBall: {
                  ...selectedPrize,
                  finalPosition: { x: 50, y: 70 }
                }
              }));

              // 결과 처리
              if (selectedPrize.points > 0) {
                setGameStats(prev => ({
                  ...prev,
                  points: (prev?.points || 0) + selectedPrize.points,
                  totalWon: (prev?.totalWon || 0) + selectedPrize.points,
                  gamesPlayed: (prev?.gamesPlayed || 0) + 1,
                  totalWins: (prev?.totalWins || 0) + 1,
                }));
                
                // 레어도에 따른 특별 알림
                if (selectedPrize.rarity === 'legendary') {
                  alert(`🎊 레전더리! ${selectedPrize.emoji} ${selectedPrize.name} ${safeFormatNumber(selectedPrize.points)}P 획득! 대박입니다!`);
                } else if (selectedPrize.rarity === 'epic') {
                  alert(`✨ 에픽! ${selectedPrize.emoji} ${selectedPrize.name} ${safeFormatNumber(selectedPrize.points)}P 획득!`);
                } else if (selectedPrize.rarity === 'rare') {
                  alert(`🎉 레어! ${selectedPrize.emoji} ${selectedPrize.name} ${safeFormatNumber(selectedPrize.points)}P 획득!`);
                } else {
                  alert(`${selectedPrize.emoji} ${selectedPrize.name} ${safeFormatNumber(selectedPrize.points)}P 획득!`);
                }
              } else {
                setGameStats(prev => ({
                  ...prev,
                  gamesPlayed: (prev?.gamesPlayed || 0) + 1,
                }));
                alert(`${selectedPrize.emoji} ${selectedPrize.name}! 다음 기회에~`);
              }
            }, 1000);
          }
        }, 200);
      }, 2500);

    } catch (error) {
      console.error("뽑기 게임 실패:", error);
      setDrawGame(prev => ({ 
        ...prev, 
        isPlaying: false, 
        machineAnimation: false, 
        isShaking: false 
      }));
    }
  };

  // 🆕 업그레이드된 행운의 번호 생성 (액션감 추가)
  const generateInteractiveLuckyNumbers = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const cost = luckyGame.cost;
      
      if (currentPoints < cost) {
        alert(`포인트가 부족합니다! ${safeFormatNumber(cost)}P가 필요해요.`);
        return;
      }

      // 포인트 차감
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - cost,
        totalSpent: (prev?.totalSpent || 0) + cost,
        gamesPlayed: (prev?.gamesPlayed || 0) + 1,
      }));

      // 🔮 단계별 애니메이션 시작
      setLuckyGame(prev => ({ 
        ...prev, 
        isGenerating: true,
        animationPhase: "charging",
        crystalPower: 0,
        generatedNumbers: []
      }));

      // 1단계: 차징 (3초)
      const chargingInterval = setInterval(() => {
        setLuckyGame(prev => ({
          ...prev,
          crystalPower: Math.min(prev.crystalPower + 2, 100)
        }));
      }, 60);

      setTimeout(() => {
        clearInterval(chargingInterval);
        setLuckyGame(prev => ({ ...prev, animationPhase: "casting" }));

        // 2단계: 캐스팅 (2초)
        setTimeout(() => {
          setLuckyGame(prev => ({ ...prev, animationPhase: "revealing" }));

          // 3단계: 번호 하나씩 나타내기 (3초)
          const selectedMethod = luckyGame.methods.find(m => m.id === luckyGame.method);
          const numbers = generateMethodSpecificNumbers(luckyGame.method);
          
          let revealedCount = 0;
          const revealInterval = setInterval(() => {
            if (revealedCount < 6) {
              setLuckyGame(prev => ({
                ...prev,
                generatedNumbers: numbers.slice(0, revealedCount + 1)
              }));
              revealedCount++;
            } else {
              clearInterval(revealInterval);
              
              // 완료
              setTimeout(() => {
                setLuckyGame(prev => ({
                  ...prev,
                  isGenerating: false,
                  animationPhase: "idle",
                  crystalPower: 0,
                  generatedNumbers: numbers
                }));

                alert(`✨ ${selectedMethod?.name}의 신비한 힘으로 운명의 번호가 완성되었습니다!`);
              }, 500);
            }
          }, 500);
        }, 2000);
      }, 3000);

    } catch (error) {
      console.error("행운 번호 생성 실패:", error);
      setLuckyGame(prev => ({ 
        ...prev, 
        isGenerating: false,
        animationPhase: "idle",
        crystalPower: 0
      }));
    }
  };

  // 🔮 방법별 특별 번호 생성
  const generateMethodSpecificNumbers = (method: string): number[] => {
    const numbers = new Set<number>();
    
    switch (method) {
      case "crystal":
        // 수정구슬: 7과 관련된 신비한 숫자들
        [7, 14, 21, 28, 35].forEach(n => {
          if (Math.random() > 0.4 && n <= 45) numbers.add(n);
        });
        break;
      case "tarot":
        // 타로: 신비한 숫자들 (3, 7, 13, 21, 33)
        [3, 7, 13, 21, 33].forEach(n => {
          if (Math.random() > 0.3) numbers.add(n);
        });
        break;
      case "zodiac":
        // 별자리: 12와 관련된 숫자들
        [6, 12, 18, 24, 30, 36, 42].forEach(n => {
          if (Math.random() > 0.3) numbers.add(n);
        });
        break;
      case "animal":
        // 십이지신: 1-12 관련
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(n => {
          if (Math.random() > 0.2) numbers.add(n);
        });
        break;
    }

    // 6개가 안 되면 랜덤으로 채우기
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }

    return Array.from(numbers).slice(0, 6).sort((a, b) => a - b);
  };

  // ⭐ 기존 게임들은 그대로 유지하되 비용만 업데이트
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
      if (exactMatches === 6) pointReward = 3000; // 🆕 1000P → 3000P
      else if (exactMatches >= 4) pointReward = 800; // 🆕 200P → 800P
      else if (exactMatches >= 2) pointReward = 400; // 🆕 100P → 400P
      else if (numberMatches >= 3) pointReward = 200; // 🆕 50P → 200P
      else if (numberMatches >= 1) pointReward = 80; // 🆕 20P → 80P

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
        prize = 30000; // 🆕 10,000P → 30,000P
      } else if (matches === 5 && bonusMatch) {
        grade = "2등";
        prize = 10000; // 🆕 3,000P → 10,000P
      } else if (matches === 5) {
        grade = "3등";
        prize = 5000; // 🆕 1,500P → 5,000P
      } else if (matches === 4) {
        grade = "4등";
        prize = 1500; // 🆕 500P → 1,500P
      } else if (matches === 3) {
        grade = "5등";
        prize = 600; // 🆕 200P → 600P
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

  // ✅ 로딩 상태 처리
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
      {/* 🆕 광고 시청 모달 */}
      {adState.isWatching && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            backgroundColor: currentColors.surface,
            padding: "24px",
            borderRadius: "12px",
            textAlign: "center",
            minWidth: "300px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>📺</div>
            <h3 style={{ color: currentColors.text, margin: "0 0 16px 0" }}>광고 시청 중...</h3>
            <div style={{
              width: "100%",
              height: "8px",
              backgroundColor: currentColors.gray,
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "16px"
            }}>
              <div style={{
                width: `${adState.progress}%`,
                height: "100%",
                backgroundColor: currentColors.primary,
                transition: "width 0.1s ease"
              }} />
            </div>
            <p style={{ color: currentColors.textSecondary, margin: "0", fontSize: "12px" }}>
              {Math.ceil((100 - adState.progress) * 0.3)}초 남음... 기다려주세요!
            </p>
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
          인터랙티브 게임으로 포인트를 모아보세요!
        </p>

        {/* 🆕 업그레이드된 포인트 정보 */}
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

          {/* 🆕 광고 시청 버튼 */}
          <button
            onClick={watchAdForPoints}
            disabled={!checkDailyLimit('ad') || adState.isWatching}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: checkDailyLimit('ad') ? "#f59e0b" : currentColors.textSecondary,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: checkDailyLimit('ad') && !adState.isWatching ? "pointer" : "not-allowed",
              fontWeight: "bold",
              opacity: checkDailyLimit('ad') && !adState.isWatching ? 1 : 0.6,
            }}
          >
            📺 광고 시청하고 300P 받기 {!checkDailyLimit('ad') ? "(일일 한도 초과)" : ""}
          </button>

          {/* 일일 제한 표시 */}
          <div style={{ fontSize: "10px", color: currentColors.successText, marginTop: "8px", opacity: 0.8 }}>
            {(() => {
              const today = new Date().toDateString();
              const chargeCount = gameStats.dailyChargeDate === today ? gameStats.dailyChargeCount || 0 : 0;
              const adCount = gameStats.dailyAdDate === today ? gameStats.dailyAdCount || 0 : 0;
              return `포인트 충전: ${chargeCount}/3 | 광고 시청: ${adCount}/10`;
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

      {/* 🆕 인터랙티브 추억의 뽑기머신 */}
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
              🎰 추억의 뽑기머신
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

          {/* 뽑기머신 시각적 표현 */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "300px",
              backgroundColor: "#8b5cf6",
              borderRadius: "12px",
              margin: "16px 0",
              overflow: "hidden",
              border: "4px solid #6d28d9",
              transform: drawGame.isShaking ? "translateX(-2px)" : "none",
              animation: drawGame.isShaking ? "shake 0.3s infinite" : drawGame.machineAnimation ? "pulse 2s infinite" : "none",
            }}
          >
            {/* 머신 상단 */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "16px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              🎰 LUCKY MACHINE 🎰
            </div>

            {/* 뽑기 구멍 */}
            <div
              style={{
                position: "absolute",
                top: "50px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "120px",
                height: "120px",
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: "50%",
                border: "3px solid #4c1d95",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* 떨어지는 공들 애니메이션 */}
              {drawGame.isPlaying && (
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: drawGame.ballPosition?.color === 'gold' ? '#fbbf24' : 
                                   drawGame.ballPosition?.color === 'red' ? '#ef4444' :
                                   drawGame.ballPosition?.color === 'blue' ? '#3b82f6' :
                                   drawGame.ballPosition?.color === 'purple' ? '#8b5cf6' : '#10b981',
                    position: "relative",
                    left: `${(drawGame.ballPosition?.x || 50) - 50}%`,
                    top: `${(drawGame.ballPosition?.y || 50) - 50}%`,
                    animation: "bounce 0.5s infinite",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                />
              )}
            </div>

            {/* 결과 표시 영역 */}
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "90%",
                padding: "12px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              {drawGame.result ? (
                <div>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    {drawGame.result.emoji}
                  </div>
                  <div style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>
                    {drawGame.result.name}
                  </div>
                  {drawGame.result.points > 0 && (
                    <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "bold" }}>
                      +{safeFormatNumber(drawGame.result.points)}P
                    </div>
                  )}
                </div>
              ) : drawGame.isPlaying ? (
                <div style={{ color: "white", fontSize: "14px" }}>
                  🎲 뽑는 중...
                </div>
              ) : (
                <div style={{ color: "white", fontSize: "12px" }}>
                  뽑기 버튼을 눌러 시작하세요!
                </div>
              )}
            </div>

            {/* 장식용 LED */}
            <div style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: drawGame.machineAnimation ? "#ef4444" : "#4ade80",
              animation: drawGame.machineAnimation ? "blink 0.5s infinite" : "none",
            }} />
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
                    backgroundColor: 
                      prize.rarity === 'legendary' ? 'rgba(251, 191, 36, 0.1)' :
                      prize.rarity === 'epic' ? 'rgba(168, 85, 247, 0.1)' :
                      prize.rarity === 'rare' ? 'rgba(59, 130, 246, 0.1)' :
                      currentColors.gray,
                    borderRadius: "6px",
                    border: `1px solid ${
                      prize.rarity === 'legendary' ? '#fbbf24' :
                      prize.rarity === 'epic' ? '#a855f7' :
                      prize.rarity === 'rare' ? '#3b82f6' :
                      currentColors.grayBorder
                    }`,
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
                      {(prize.probability * 100).toFixed(1)}% 확률
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 뽑기 버튼 */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={startInteractiveDrawGame}
              disabled={(gameStats?.points || 0) < drawGame.cost || drawGame.isPlaying}
              style={{
                padding: "16px 24px",
                backgroundColor: (gameStats?.points || 0) >= drawGame.cost && !drawGame.isPlaying ? "#f59e0b" : currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: (gameStats?.points || 0) >= drawGame.cost && !drawGame.isPlaying ? "pointer" : "not-allowed",
                boxShadow: (gameStats?.points || 0) >= drawGame.cost && !drawGame.isPlaying ? "0 4px 12px rgba(245, 158, 11, 0.3)" : "none",
                transform: drawGame.isPlaying ? "scale(0.95)" : "scale(1)",
                transition: "all 0.2s",
              }}
            >
              {drawGame.isPlaying ? "🎰 뽑는 중..." : `🎰 뽑기 시작! (${safeFormatNumber(drawGame.cost)}P)`}
            </button>
          </div>

          {/* 결과 초기화 버튼 */}
          {drawGame.result && (
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                onClick={() => setDrawGame(prev => ({ ...prev, result: null, selectedBall: null }))}
                style={{
                  padding: "8px 16px",
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
            </div>
          )}
        </div>
      )}

      {/* 🆕 신비한 점술소 (행운의 번호) */}
      {selectedGame === "lucky" && (
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
              🔮 신비한 점술소
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

          {/* 점술 방법 선택 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              ✨ 점술 방법 선택
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {luckyGame.methods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setLuckyGame(prev => ({ ...prev, method: method.id as any }))}
                  disabled={luckyGame.isGenerating}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: luckyGame.method === method.id 
                      ? `2px solid ${currentColors.purple}` 
                      : `1px solid ${currentColors.border}`,
                    backgroundColor: luckyGame.method === method.id 
                      ? currentColors.purple 
                      : currentColors.surface,
                    cursor: luckyGame.isGenerating ? "not-allowed" : "pointer",
                    textAlign: "left",
                    opacity: luckyGame.isGenerating ? 0.6 : 1,
                  }}
                >
                  <div style={{ 
                    fontSize: "14px", 
                    fontWeight: "bold", 
                    color: luckyGame.method === method.id ? currentColors.purpleText : currentColors.text,
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <span>{method.name}</span>
                    <span style={{ 
                      fontSize: "11px",
                      padding: "2px 6px",
                      backgroundColor: 'rgba(168, 85, 247, 0.2)',
                      borderRadius: "4px"
                    }}>
                      파워 {method.powerLevel}%
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: luckyGame.method === method.id ? currentColors.purpleText : currentColors.textSecondary 
                  }}>
                    {method.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 점술 진행 화면 */}
          {luckyGame.isGenerating ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              {/* 차징 단계 */}
              {luckyGame.animationPhase === "charging" && (
                <div>
                  <div style={{ fontSize: "64px", marginBottom: "16px", animation: "glow 2s infinite" }}>
                    🔮
                  </div>
                  <h4 style={{ color: currentColors.text, margin: "0 0 12px 0" }}>
                    🌟 신비한 에너지 충전 중...
                  </h4>
                  <div style={{
                    width: "200px",
                    height: "8px",
                    backgroundColor: currentColors.gray,
                    borderRadius: "4px",
                    margin: "0 auto 12px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${luckyGame.crystalPower}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc)",
                      borderRadius: "4px",
                      transition: "width 0.1s ease"
                    }} />
                  </div>
                  <p style={{ color: currentColors.textSecondary, fontSize: "12px", margin: "0" }}>
                    마법 에너지: {luckyGame.crystalPower}%
                  </p>
                </div>
              )}

              {/* 캐스팅 단계 */}
              {luckyGame.animationPhase === "casting" && (
                <div>
                  <div style={{ fontSize: "64px", marginBottom: "16px", animation: "spin 2s linear infinite" }}>
                    ✨
                  </div>
                  <h4 style={{ color: currentColors.text, margin: "0 0 12px 0" }}>
                    🌠 운명의 실을 엮는 중...
                  </h4>
                  <p style={{ color: currentColors.textSecondary, fontSize: "12px", margin: "0" }}>
                    우주의 기운이 모이고 있습니다...
                  </p>
                </div>
              )}

              {/* 번호 공개 단계 */}
              {luckyGame.animationPhase === "revealing" && (
                <div>
                  <div style={{ fontSize: "64px", marginBottom: "16px", animation: "bounce 1s infinite" }}>
                    🎭
                  </div>
                  <h4 style={{ color: currentColors.text, margin: "0 0 12px 0" }}>
                    🔮 운명의 번호 공개 중...
                  </h4>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                    {luckyGame.generatedNumbers.map((num, i) => (
                      <div
                        key={i}
                        style={{
                          animation: `fadeInScale 0.5s ease ${i * 0.5}s both`
                        }}
                      >
                        <LottoNumberBall number={num} size="md" theme={theme} />
                      </div>
                    ))}
                    {Array.from({ length: 6 - luckyGame.generatedNumbers.length }).map((_, i) => (
                      <div
                        key={`placeholder-${i}`}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: currentColors.gray,
                          border: `2px dashed ${currentColors.grayBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: currentColors.textSecondary,
                          animation: "pulse 1s infinite",
                        }}
                      >
                        ?
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : luckyGame.generatedNumbers.length > 0 ? (
            /* 결과 표시 */
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  padding: "24px",
                  backgroundColor: currentColors.purple,
                  borderRadius: "12px",
                  border: `2px solid ${currentColors.purpleBorder}`,
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌟</div>
                <h4 style={{ 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: currentColors.purpleText,
                  margin: "0 0 12px 0" 
                }}>
                  ✨ 운명의 번호가 공개되었습니다! ✨
                </h4>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                  {luckyGame.generatedNumbers.map((num, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        animation: `float 3s ease-in-out ${i * 0.2}s infinite`
                      }}
                    >
                      <LottoNumberBall number={num} size="md" theme={theme} />
                      <div style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        fontSize: "12px",
                        animation: "sparkle 2s infinite"
                      }}>
                        ✨
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ 
                  fontSize: "12px", 
                  color: currentColors.purpleText,
                  margin: "0",
                  fontStyle: "italic"
                }}>
                  {luckyGame.methods.find(m => m.id === luckyGame.method)?.desc}
                </p>
              </div>
              
              <button
                onClick={() => setLuckyGame(prev => ({ ...prev, generatedNumbers: [] }))}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🔮 다시 점술하기
              </button>
            </div>
          ) : (
            /* 시작 버튼 */
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔮</div>
              <p style={{ fontSize: "14px", color: currentColors.textSecondary, margin: "0 0 16px 0" }}>
                선택한 점술 방법으로 신비한 번호를 생성합니다
              </p>
              <button
                onClick={generateInteractiveLuckyNumbers}
                disabled={(gameStats?.points || 0) < luckyGame.cost}
                style={{
                  padding: "16px 24px",
                  backgroundColor: (gameStats?.points || 0) >= luckyGame.cost ? "#8b5cf6" : currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: (gameStats?.points || 0) >= luckyGame.cost ? "pointer" : "not-allowed",
                  boxShadow: (gameStats?.points || 0) >= luckyGame.cost ? "0 4px 12px rgba(139, 92, 246, 0.3)" : "none",
                }}
              >
                🔮 점술 시작! ({safeFormatNumber(luckyGame.cost)}P)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 기존 게임들 (번호맞추기, 가상로또) - 비용만 업데이트된 버전 유지 */}
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
            /* 번호맞추기 게임 진행 화면 - 기존과 동일하지만 보상 업데이트 */
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

      {/* 가상 로또 시뮬레이션 - 기존과 동일하지만 비용/보상 업데이트 */}
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
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
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
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          @keyframes fadeInScale {
            0% { 
              opacity: 0; 
              transform: scale(0.5);
            }
            100% { 
              opacity: 1; 
              transform: scale(1);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }
          
          /* 🔮 수정구슬 애니메이션 */
          .crystal-ball {
            animation: glow 3s ease-in-out infinite;
          }
          
          /* 🎰 뽑기머신 애니메이션 */
          .machine-shake {
            animation: shake 0.3s infinite;
          }
          
          /* ✨ 반짝이는 효과 */
          .sparkle-effect {
            position: relative;
          }
          .sparkle-effect::before {
            content: "✨";
            position: absolute;
            top: -5px;
            right: -5px;
            animation: sparkle 2s infinite;
            font-size: 12px;
          }
          
          /* 🌟 번호 공개 애니메이션 */
          .number-reveal {
            animation: fadeInScale 0.8s ease-out;
          }
          
          /* 🎪 뽑기 공 애니메이션 */
          .lottery-ball {
            animation: float 2s ease-in-out infinite;
          }
          
          /* 🔥 특별 효과들 */
          .legendary-glow {
            box-shadow: 0 0 20px #fbbf24, 0 0 40px #fbbf24;
            animation: glow 2s infinite;
          }
          
          .epic-glow {
            box-shadow: 0 0 15px #a855f7, 0 0 30px #a855f7;
            animation: pulse 2s infinite;
          }
          
          .rare-glow {
            box-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6;
            animation: pulse 1.5s infinite;
          }
          
          /* 광고 진행 바 애니메이션 */
          .ad-progress {
            transition: width 0.1s linear;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            background-size: 200% 100%;
            animation: rainbow 3s linear infinite;
          }
          
          @keyframes rainbow {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
          }
          
          /* 포인트 증가 애니메이션 */
          .points-increase {
            animation: pointsUp 1s ease-out;
          }
          
          @keyframes pointsUp {
            0% { 
              transform: translateY(0) scale(1);
              color: inherit;
            }
            50% { 
              transform: translateY(-10px) scale(1.2);
              color: #10b981;
            }
            100% { 
              transform: translateY(0) scale(1);
              color: inherit;
            }
          }
          
          /* 게임 버튼 호버 효과 */
          .game-button {
            transition: all 0.3s ease;
          }
          .game-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .game-button:active {
            transform: translateY(0);
          }
          
          /* 뽑기머신 LED 효과 */
          .machine-led {
            animation: blink 1s infinite;
          }
          .machine-led.active {
            animation: blink 0.3s infinite;
          }
          
          /* 점술 파워 차징 효과 */
          .power-charging {
            background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc);
            background-size: 200% 100%;
            animation: powerFlow 2s linear infinite;
          }
          
          @keyframes powerFlow {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
          }
          
          /* 성공/실패 피드백 애니메이션 */
          .success-feedback {
            animation: successPulse 1s ease-out;
          }
          
          @keyframes successPulse {
            0% { 
              background-color: currentColor;
              transform: scale(1);
            }
            50% { 
              background-color: #10b981;
              transform: scale(1.05);
            }
            100% { 
              background-color: currentColor;
              transform: scale(1);
            }
          }
          
          .fail-feedback {
            animation: failShake 0.5s ease-out;
          }
          
          @keyframes failShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          /* 모바일 최적화 애니메이션 */
          @media (max-width: 480px) {
            .sparkle-effect::before {
              font-size: 10px;
            }
            
            .number-reveal {
              animation-duration: 0.6s;
            }
            
            .float {
              animation-duration: 1.5s;
            }
          }
          
          /* 다크모드 애니메이션 조정 */
          @media (prefers-color-scheme: dark) {
            .glow {
              filter: brightness(0.8);
            }
            
            .sparkle-effect {
              filter: brightness(1.2);
            }
          }
        `}
      </style>
    </div>
  );
};

export default MiniGame;
