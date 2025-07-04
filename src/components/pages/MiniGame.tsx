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
  points: number; // 원 → 포인트로 변경
  totalSpent: number;
  totalWon: number;
  dailyBonusDate?: string; // 일일 보너스 날짜
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
  
  // ✅ 기본값을 상수로 정의 (포인트 시스템)
  const defaultGameStats: GameStats = {
    gamesPlayed: 0,
    bestScore: 0,
    totalWins: 0,
    points: 1000, // 시작 포인트 1000P
    totalSpent: 0,
    totalWon: 0,
  };

  const [gameStats, setGameStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem("lotto-game-stats");
      if (saved) {
        const parsed = JSON.parse(saved);
        // ✅ 각 필드가 존재하고 숫자인지 확인
        return {
          gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
          bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
          totalWins: typeof parsed.totalWins === 'number' ? parsed.totalWins : 0,
          points: typeof parsed.points === 'number' ? parsed.points : (typeof parsed.virtualMoney === 'number' ? parsed.virtualMoney : 1000), // 마이그레이션
          totalSpent: typeof parsed.totalSpent === 'number' ? parsed.totalSpent : 0,
          totalWon: typeof parsed.totalWon === 'number' ? parsed.totalWon : 0,
          dailyBonusDate: parsed.dailyBonusDate || null,
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
    cost: 50, // 게임 비용 50P
  });

  // 가상 로또 시뮬레이션 상태
  const [simulation, setSimulation] = useState({
    selectedNumbers: [] as number[],
    ticketPrice: 100, // 100P
    currentRound: 0,
    results: [] as any[],
    isPlaying: false,
    autoPlay: false,
    speed: 1,
  });

  // 🆕 추억의 뽑기 게임 상태
  const [drawGame, setDrawGame] = useState({
    isPlaying: false,
    result: null as any,
    cost: 30, // 뽑기 비용 30P
    prizes: [
      { name: "대박!", points: 500, probability: 0.01, emoji: "💎" },
      { name: "잭팟!", points: 200, probability: 0.05, emoji: "🎉" },
      { name: "당첨!", points: 100, probability: 0.1, emoji: "🏆" },
      { name: "성공!", points: 50, probability: 0.2, emoji: "⭐" },
      { name: "꽝", points: 0, probability: 0.64, emoji: "😅" },
    ],
  });

  // 🆕 행운의 번호 생성기 상태
  const [luckyGame, setLuckyGame] = useState({
    isGenerating: false,
    generatedNumbers: [] as number[],
    cost: 20, // 번호 생성 비용 20P
    method: "crystal" as "crystal" | "tarot" | "zodiac" | "animal",
    methods: [
      { id: "crystal", name: "🔮 수정구슬", desc: "신비한 수정구슬이 알려주는 행운 번호" },
      { id: "tarot", name: "🃏 타로카드", desc: "타로카드가 예언하는 운명의 번호" },
      { id: "zodiac", name: "⭐ 별자리", desc: "별자리 운세로 찾는 오늘의 번호" },
      { id: "animal", name: "🐉 동물점괘", desc: "십이지신이 알려주는 길운의 번호" },
    ],
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

  // ✅ 안전한 다크 모드 색상 테마 - 기본값 포함
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

  // ✅ 안전한 색상 선택
  const currentColors = colors[theme] || colors.light;

  // 게임 목록 (4개 게임)
  const games = [
    {
      id: "guess",
      name: "번호맞추기",
      desc: "AI가 만든 비밀번호를 힌트로 맞춰보세요!",
      emoji: "🎯",
      color: currentColors.primary,
      difficulty: "중급",
      cost: 50,
    },
    {
      id: "simulation",
      name: "가상 로또 시뮬",
      desc: "포인트로 로또를 사서 결과를 확인해보세요!",
      emoji: "🎲",
      color: "#8b5cf6",
      difficulty: "초급",
      cost: 100,
    },
    {
      id: "draw",
      name: "추억의 뽑기",
      desc: "옛날 문방구 뽑기를 그대로! 대박을 노려보세요!",
      emoji: "🎪",
      color: "#f59e0b",
      difficulty: "초급",
      cost: 30,
    },
    {
      id: "lucky",
      name: "행운의 번호",
      desc: "신비한 점술로 오늘의 행운 번호를 알아보세요!",
      emoji: "🔮",
      color: "#8b5cf6",
      difficulty: "쉬움",
      cost: 20,
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

  // 🎁 일일 보너스 포인트 지급
  const claimDailyBonus = () => {
    const today = new Date().toDateString();
    if (gameStats.dailyBonusDate !== today) {
      const bonusPoints = 100;
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) + bonusPoints,
        dailyBonusDate: today,
      }));
      alert(`🎁 일일 보너스 ${bonusPoints}P 지급! 내일 또 받으세요!`);
    } else {
      alert("😊 오늘은 이미 보너스를 받았어요. 내일 다시 오세요!");
    }
  };

  // 💎 포인트 충전 (무료)
  const chargePoints = () => {
    const chargeAmount = 500;
    setGameStats(prev => ({
      ...prev,
      points: (prev?.points || 0) + chargeAmount,
    }));
    alert(`💎 ${chargeAmount}P 충전 완료! 게임을 즐겨보세요!`);
  };

  // 번호 맞추기 게임 시작
  const startGuessGame = () => {
    try {
      if ((gameStats?.points || 0) < guessGame.cost) {
        alert(`포인트가 부족합니다! ${guessGame.cost}P가 필요해요.`);
        return;
      }

      // 포인트 차감
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

  // ✅ 안전한 비밀 번호 생성
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
      return [1, 2, 3, 4, 5, 6]; // 폴백
    }
  };

  // 번호 맞추기 추측 제출 (포인트 시스템 추가)
  const submitGuess = () => {
    const userGuess = guessGame?.userGuess || [];
    if (userGuess.length !== 6) return;

    try {
      const secretNumbers = guessGame?.secretNumbers || [];
      const exactMatches = userGuess.filter((num, idx) => num === secretNumbers[idx]).length;
      const numberMatches = userGuess.filter(num => secretNumbers.includes(num)).length;
      const wrongPosition = numberMatches - exactMatches;

      // 🆕 포인트 보상 계산 (1개라도 맞으면 포인트)
      let pointReward = 0;
      if (exactMatches === 6) pointReward = 1000; // 전체 맞춤
      else if (exactMatches >= 4) pointReward = 200; // 4개 이상
      else if (exactMatches >= 2) pointReward = 100; // 2개 이상
      else if (numberMatches >= 3) pointReward = 50; // 3개 이상 (위치 상관없이)
      else if (numberMatches >= 1) pointReward = 20; // 1개라도 맞춤

      let hint = "";
      if (exactMatches === 6) {
        hint = `🎉 완벽! 모든 번호를 맞췄어요! +${pointReward}P`;
        setGuessGame(prev => ({
          ...prev,
          gameOver: true,
          won: true,
          score: Math.max(0, 1000 - ((prev?.attempts || 0) * 100)),
          hints: [...(prev?.hints || []), hint],
        }));
        
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          totalWins: (prev?.totalWins || 0) + 1,
          bestScore: Math.max(prev?.bestScore || 0, Math.max(0, 1000 - ((guessGame?.attempts || 0) * 100))),
          points: (prev?.points || 0) + pointReward,
          totalWon: (prev?.totalWon || 0) + pointReward,
        }));
      } else {
        hint = `🎯 ${exactMatches}개 위치 정확 | 📍 ${wrongPosition}개 숫자 맞지만 위치 틀림`;
        if (pointReward > 0) {
          hint += ` | 🎁 +${pointReward}P`;
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

  // ✅ 안전한 가상 로또 시뮬레이션 시작
  const startSimulation = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const ticketPrice = simulation?.ticketPrice || 100;
      
      if (currentPoints < ticketPrice) {
        alert(`포인트가 부족합니다! ${ticketPrice}P가 필요해요.`);
        return;
      }

      if (!simulation?.selectedNumbers || simulation.selectedNumbers.length !== 6) {
        alert("6개 번호를 선택해주세요!");
        return;
      }

      // pastWinningNumbers 안전성 검사
      if (!pastWinningNumbers || pastWinningNumbers.length === 0) {
        alert("당첨번호 데이터가 없습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setSimulation(prev => ({ ...prev, isPlaying: true }));
      
      // 랜덤한 과거 회차 선택
      const randomIndex = Math.floor(Math.random() * pastWinningNumbers.length);
      const winningNumbers = pastWinningNumbers[randomIndex]?.slice(0, 6) || [1, 2, 3, 4, 5, 6];
      const bonusNumber = pastWinningNumbers[randomIndex]?.[6] || 7;

      // 당첨 확인
      const matches = simulation.selectedNumbers.filter(num => winningNumbers.includes(num)).length;
      const bonusMatch = simulation.selectedNumbers.includes(bonusNumber);

      let grade = "";
      let prize = 0;
      
      if (matches === 6) {
        grade = "1등";
        prize = 10000; // 10,000P
      } else if (matches === 5 && bonusMatch) {
        grade = "2등";
        prize = 3000; // 3,000P
      } else if (matches === 5) {
        grade = "3등";
        prize = 1500; // 1,500P
      } else if (matches === 4) {
        grade = "4등";
        prize = 500; // 500P
      } else if (matches === 3) {
        grade = "5등";
        prize = 200; // 200P
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
          results: [result, ...(prev.results || []).slice(0, 9)], // 최근 10개만 유지
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

  // 🆕 추억의 뽑기 게임 시작
  const startDrawGame = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const cost = drawGame.cost;
      
      if (currentPoints < cost) {
        alert(`포인트가 부족합니다! ${cost}P가 필요해요.`);
        return;
      }

      setDrawGame(prev => ({ ...prev, isPlaying: true }));

      // 포인트 차감
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - cost,
        totalSpent: (prev?.totalSpent || 0) + cost,
      }));

      setTimeout(() => {
        // 확률에 따른 뽑기 결과
        const random = Math.random();
        let cumulativeProbability = 0;
        let selectedPrize = drawGame.prizes[drawGame.prizes.length - 1]; // 기본값: 꽝

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
          alert(`${selectedPrize.emoji} ${selectedPrize.name} ${selectedPrize.points}P 획득!`);
        } else {
          setGameStats(prev => ({
            ...prev,
            gamesPlayed: (prev?.gamesPlayed || 0) + 1,
          }));
          alert(`${selectedPrize.emoji} ${selectedPrize.name}! 다음 기회에~`);
        }
      }, 2000);
    } catch (error) {
      console.error("뽑기 게임 실패:", error);
      setDrawGame(prev => ({ ...prev, isPlaying: false }));
    }
  };

  // 🆕 행운의 번호 생성
  const generateLuckyNumbers = () => {
    try {
      const currentPoints = gameStats?.points || 0;
      const cost = luckyGame.cost;
      
      if (currentPoints < cost) {
        alert(`포인트가 부족합니다! ${cost}P가 필요해요.`);
        return;
      }

      setLuckyGame(prev => ({ ...prev, isGenerating: true }));

      // 포인트 차감
      setGameStats(prev => ({
        ...prev,
        points: (prev?.points || 0) - cost,
        totalSpent: (prev?.totalSpent || 0) + cost,
        gamesPlayed: (prev?.gamesPlayed || 0) + 1,
      }));

      setTimeout(() => {
        // 선택된 방법에 따른 특별한 번호 생성
        const numbers = new Set<number>();
        
        // 각 방법별 특별한 로직
        switch (luckyGame.method) {
          case "crystal":
            // 수정구슬: 7의 배수와 소수 선호
            [7, 14, 21, 28, 35, 42].forEach(n => {
              if (Math.random() > 0.5 && n <= 45) numbers.add(n);
            });
            break;
          case "tarot":
            // 타로: 신비한 숫자들 선호
            [3, 7, 13, 17, 21, 33].forEach(n => {
              if (Math.random() > 0.4) numbers.add(n);
            });
            break;
          case "zodiac":
            // 별자리: 12의 배수와 관련 숫자
            [6, 12, 18, 24, 30, 36].forEach(n => {
              if (Math.random() > 0.4) numbers.add(n);
            });
            break;
          case "animal":
            // 동물: 12지신 관련 숫자
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(n => {
              if (Math.random() > 0.3) numbers.add(n);
            });
            break;
        }

        // 6개가 안 되면 랜덤으로 채우기
        while (numbers.size < 6) {
          numbers.add(Math.floor(Math.random() * 45) + 1);
        }

        const luckyNumbers = Array.from(numbers).slice(0, 6).sort((a, b) => a - b);

        setLuckyGame(prev => ({
          ...prev,
          isGenerating: false,
          generatedNumbers: luckyNumbers,
        }));

        const methodName = luckyGame.methods.find(m => m.id === luckyGame.method)?.name || "신비한 점술";
        alert(`✨ ${methodName}이 예언한 행운의 번호가 생성되었습니다!`);
      }, 3000);
    } catch (error) {
      console.error("행운 번호 생성 실패:", error);
      setLuckyGame(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // 번호 선택/해제 (시뮬레이션용)
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

  // 자동 번호 생성
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

  // ✅ 에러 상태 처리
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

  console.log("🎮 MiniGame 정상 렌더링", { selectedGame, gamesCount: games.length });

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
          🎮 로또 미니게임
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: currentColors.textSecondary,
            margin: "0 0 16px 0",
          }}
        >
          재미있는 게임으로 포인트를 모아보세요!
        </p>

        {/* 포인트 정보 및 충전 */}
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
          <div style={{ fontSize: "24px", fontWeight: "bold", color: currentColors.successText, marginBottom: "4px" }}>
            💎 {safeFormatNumber(gameStats?.points)}P
          </div>
          <div style={{ fontSize: "12px", color: currentColors.successText, marginBottom: "8px" }}>
            보유 포인트
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              onClick={claimDailyBonus}
              style={{
                padding: "6px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🎁 일일보너스
            </button>
            <button
              onClick={chargePoints}
              style={{
                padding: "6px 12px",
                backgroundColor: currentColors.primary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              💰 포인트 충전
            </button>
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

      {/* 게임 선택 (4개 게임) */}
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
                  if (game.id === "guess") {
                    // 번호맞추기는 시작 시 포인트 확인
                  }
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
                      fontSize: "10px",
                      padding: "2px 6px",
                      backgroundColor: game.color,
                      color: "white",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {game.cost}P
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

      {/* 번호 맞추기 게임 */}
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
              onClick={() => {
                console.log("🔙 게임 선택으로 돌아가기");
                setSelectedGame(null);
              }}
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
                💎 비용: {guessGame.cost}P | 1개라도 맞추면 포인트 획득!
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
                🎮 게임 시작
              </button>
            </div>
          ) : (
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
                    점수: {guessGame?.score || 0}
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
              onClick={() => {
                console.log("🔙 게임 선택으로 돌아가기");
                setSelectedGame(null);
              }}
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
                      (gameStats?.points || 0) < (simulation?.ticketPrice || 100)
                    }
                    style={{
                      padding: "8px 16px",
                      backgroundColor: 
                        (simulation?.selectedNumbers || []).length === 6 && 
                        (gameStats?.points || 0) >= (simulation?.ticketPrice || 100)
                          ? currentColors.primary 
                          : currentColors.textSecondary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: 
                        (simulation?.selectedNumbers || []).length === 6 && 
                        (gameStats?.points || 0) >= (simulation?.ticketPrice || 100)
                          ? "pointer" 
                          : "not-allowed",
                    }}
                  >
                    🎫 로또 구매하기
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

      {/* 🆕 추억의 뽑기 게임 */}
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
              🎪 추억의 뽑기게임
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

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "64px", marginBottom: "8px" }}>🎪</div>
            <p style={{ fontSize: "14px", color: currentColors.textSecondary, margin: "0 0 8px 0" }}>
              어린 시절 문방구에서 했던 그 추억의 뽑기!
            </p>
            <p style={{ fontSize: "12px", color: currentColors.primary, fontWeight: "bold", margin: "0 0 16px 0" }}>
              💎 비용: {drawGame.cost}P
            </p>
          </div>

          {/* 상품 목록 */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              🏆 상품 목록
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {drawGame.prizes.map((prize, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: currentColors.gray,
                    borderRadius: "6px",
                    border: `1px solid ${currentColors.grayBorder}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>{prize.emoji}</span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: currentColors.text }}>
                      {prize.name}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: currentColors.primary }}>
                      {prize.points > 0 ? `${prize.points}P` : "0P"}
                    </div>
                    <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                      {(prize.probability * 100).toFixed(1)}% 확률
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 뽑기 버튼 또는 결과 */}
          {drawGame.isPlaying ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  border: `4px solid ${currentColors.border}`,
                  borderTop: `4px solid #f59e0b`,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: currentColors.text, fontSize: "16px", fontWeight: "bold" }}>
                🎪 뽑기 중...
              </p>
            </div>
          ) : drawGame.result ? (
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: drawGame.result.points > 0 ? currentColors.success : currentColors.warning,
                  borderRadius: "12px",
                  border: drawGame.result.points > 0 ? `2px solid ${currentColors.successBorder}` : `2px solid ${currentColors.warningBorder}`,
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "8px" }}>{drawGame.result.emoji}</div>
                <h4 style={{ 
                  fontSize: "20px", 
                  fontWeight: "bold", 
                  color: drawGame.result.points > 0 ? currentColors.successText : currentColors.warningText,
                  margin: "0 0 8px 0" 
                }}>
                  {drawGame.result.name}
                </h4>
                {drawGame.result.points > 0 && (
                  <p style={{ 
                    fontSize: "16px", 
                    fontWeight: "bold", 
                    color: currentColors.successText,
                    margin: "0" 
                  }}>
                    +{drawGame.result.points}P 획득!
                  </p>
                )}
              </div>
              <button
                onClick={() => setDrawGame(prev => ({ ...prev, result: null }))}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🎪 다시 뽑기
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={startDrawGame}
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
                🎪 뽑기 시작!
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🆕 행운의 번호 생성기 */}
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
              🔮 행운의 번호 생성기
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

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "64px", marginBottom: "8px" }}>🔮</div>
            <p style={{ fontSize: "14px", color: currentColors.textSecondary, margin: "0 0 8px 0" }}>
              신비한 점술로 오늘의 행운 번호를 알아보세요!
            </p>
            <p style={{ fontSize: "12px", color: currentColors.primary, fontWeight: "bold", margin: "0 0 16px 0" }}>
              💎 비용: {luckyGame.cost}P
            </p>
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
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: luckyGame.method === method.id 
                      ? `2px solid ${currentColors.purple}` 
                      : `1px solid ${currentColors.border}`,
                    backgroundColor: luckyGame.method === method.id 
                      ? currentColors.purple 
                      : currentColors.surface,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ 
                    fontSize: "14px", 
                    fontWeight: "bold", 
                    color: luckyGame.method === method.id ? currentColors.purpleText : currentColors.text,
                    marginBottom: "4px"
                  }}>
                    {method.name}
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

          {/* 생성된 번호 또는 생성 버튼 */}
          {luckyGame.isGenerating ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  border: `4px solid ${currentColors.border}`,
                  borderTop: `4px solid #8b5cf6`,
                  borderRadius: "50%",
                  animation: "spin 1.2s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: currentColors.text, fontSize: "16px", fontWeight: "bold" }}>
                🔮 신비한 점술 중...
              </p>
              <p style={{ color: currentColors.textSecondary, fontSize: "12px" }}>
                우주의 기운을 분석하고 있습니다
              </p>
            </div>
          ) : luckyGame.generatedNumbers.length > 0 ? (
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: currentColors.purple,
                  borderRadius: "12px",
                  border: `2px solid ${currentColors.purpleBorder}`,
                  marginBottom: "12px",
                }}
              >
                <h4 style={{ 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: currentColors.purpleText,
                  margin: "0 0 12px 0" 
                }}>
                  ✨ 오늘의 행운 번호 ✨
                </h4>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {luckyGame.generatedNumbers.map((num, i) => (
                    <LottoNumberBall key={i} number={num} size="md" theme={theme} />
                  ))}
                </div>
                <p style={{ 
                  fontSize: "12px", 
                  color: currentColors.purpleText,
                  margin: "12px 0 0 0",
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
            <div style={{ textAlign: "center" }}>
              <button
                onClick={generateLuckyNumbers}
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
                🔮 행운 번호 생성!
              </button>
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
        `}
      </style>
    </div>
  );
};

export default MiniGame;
