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
  gamePoints: number;
  totalUsed: number;
  totalEarned: number;
  guessGameWins: number;
  simulationWins: number;
  gachaWins: number;
  collectedCombos: string[];
  lastDailyBonus: string;
  emergencyCharges: number;
  lastEmergencyCharge: string;
}

interface GachaItem {
  id: string;
  name: string;
  numbers: number[];
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
  description: string;
}

const MiniGame: React.FC<MiniGameProps> = ({
  pastWinningNumbers,
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
}) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem("lotto-game-stats");
    return saved ? JSON.parse(saved) : {
      gamesPlayed: 0,
      bestScore: 0,
      totalWins: 0,
      gamePoints: 1000, // 시작 포인트 1000점
      totalUsed: 0,
      totalEarned: 0,
      guessGameWins: 0,
      simulationWins: 0,
      gachaWins: 0,
      collectedCombos: [],
      lastDailyBonus: "",
      emergencyCharges: 0,
      lastEmergencyCharge: "",
    };
  });

  // 번호 맞추기 게임 상태
  const [guessGame, setGuessGame] = useState({
    secretNumbers: [] as number[],
    userGuess: [] as number[],
    attempts: 0,
    maxAttempts: 8,
    hints: [] as string[],
    gameOver: false,
    won: false,
    score: 0,
    pointsEarned: 0,
  });

  // 번호 확인 게임 상태
  const [simulation, setSimulation] = useState({
    selectedNumbers: [] as number[],
    gameCost: 10,
    currentRound: 0,
    results: [] as any[],
    isPlaying: false,
    autoPlay: false,
    speed: 1,
  });

  // 뽑기 게임 상태
  const [gachaGame, setGachaGame] = useState({
    isOpening: false,
    lastPulled: null as GachaItem | null,
    pullCost: 20,
    inventory: [] as GachaItem[],
    showInventory: false,
  });

  // 실제 회차 범위 정보 사용
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers.length;

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
      // 희귀도 색상
      common: "#9ca3af",
      rare: "#3b82f6",
      epic: "#8b5cf6",
      legendary: "#f59e0b",
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
      // 희귀도 색상 (다크모드)
      common: "#6b7280",
      rare: "#60a5fa",
      epic: "#a78bfa",
      legendary: "#fbbf24",
    },
  };

  const currentColors = colors[theme];

  // 게임 목록 - 3개로 확장
  const games = [
    {
      id: "guess",
      name: "번호맞추기",
      desc: "논리적 추론으로 비밀번호를 찾아서 포인트 획득!",
      emoji: "🎯",
      color: currentColors.primary,
      difficulty: "중급",
      earnPoints: "성공시 50-200pt",
    },
    {
      id: "simulation",
      name: "번호 확인 게임",
      desc: "내가 선택한 번호를 과거 당첨번호와 비교해보세요!",
      emoji: "🎲",
      color: "#8b5cf6",
      difficulty: "초급",
      earnPoints: "당첨시 20-1000pt",
    },
    {
      id: "gacha",
      name: "번호 뽑기",
      desc: "신비한 캡슐에서 특별한 번호 조합을 뽑아보세요!",
      emoji: "🎁",
      color: "#f59e0b",
      difficulty: "초급",
      earnPoints: "뽑기시 10-500pt",
    },
  ];

  // 뽑기 아이템 풀
  const gachaPool: GachaItem[] = [
    // 일반 (70%)
    { id: "c1", name: "연속번호 조합", numbers: [1, 2, 3, 4, 5, 6], rarity: "common", points: 10, description: "1부터 6까지 연속번호" },
    { id: "c2", name: "짝수 조합", numbers: [2, 4, 6, 8, 10, 12], rarity: "common", points: 15, description: "모두 짝수인 조합" },
    { id: "c3", name: "홀수 조합", numbers: [1, 3, 5, 7, 9, 11], rarity: "common", points: 15, description: "모두 홀수인 조합" },
    { id: "c4", name: "저번대 조합", numbers: [1, 5, 9, 13, 17, 21], rarity: "common", points: 12, description: "1-20대 위주 조합" },
    
    // 레어 (20%)
    { id: "r1", name: "피보나치 조합", numbers: [1, 1, 2, 3, 5, 8], rarity: "rare", points: 50, description: "수학적 피보나치 수열" },
    { id: "r2", name: "소수 조합", numbers: [2, 3, 5, 7, 11, 13], rarity: "rare", points: 60, description: "모두 소수인 조합" },
    { id: "r3", name: "제곱수 조합", numbers: [1, 4, 9, 16, 25, 36], rarity: "rare", points: 55, description: "완전제곱수 조합" },
    
    // 에픽 (8%)
    { id: "e1", name: "황금비율 조합", numbers: [8, 13, 21, 34, 55, 89], rarity: "epic", points: 150, description: "황금비율 기반 조합" },
    { id: "e2", name: "별자리 조합", numbers: [7, 14, 21, 28, 35, 42], rarity: "epic", points: 120, description: "7의 배수 별자리 조합" },
    
    // 레전드 (2%)
    { id: "l1", name: "행운의 777", numbers: [7, 17, 27, 37, 41, 43], rarity: "legendary", points: 500, description: "전설의 럭키 세븐 조합" },
    { id: "l2", name: "완벽한 균형", numbers: [3, 15, 23, 31, 39, 44], rarity: "legendary", points: 400, description: "모든 구간 완벽 분배" },
  ];

  // 현재 날짜 문자열 가져오기
  const getTodayString = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // 일일 보너스 확인
  const canGetDailyBonus = (): boolean => {
    const today = getTodayString();
    return gameStats.lastDailyBonus !== today;
  };

  // 긴급 충전 가능 확인
  const canUseEmergencyCharge = (): boolean => {
    const today = getTodayString();
    if (gameStats.lastEmergencyCharge !== today) {
      return true; // 새로운 날이면 초기화
    }
    return gameStats.emergencyCharges < 2; // 하루 2회 제한
  };

  // 일일 보너스 받기
  const claimDailyBonus = () => {
    if (!canGetDailyBonus()) {
      alert("오늘은 이미 일일 보너스를 받았습니다! 🎁");
      return;
    }

    const bonusPoints = 100;
    setGameStats(prev => ({
      ...prev,
      gamePoints: prev.gamePoints + bonusPoints,
      totalEarned: prev.totalEarned + bonusPoints,
      lastDailyBonus: getTodayString(),
    }));

    alert(`🎁 일일 출석 보너스!\n${bonusPoints}pt를 받았습니다! ✨`);
  };

  // 긴급 충전
  const useEmergencyCharge = () => {
    if (!canUseEmergencyCharge()) {
      alert("오늘의 긴급 충전을 모두 사용했습니다! (하루 2회 제한) 🚫");
      return;
    }

    const chargePoints = 50;
    const today = getTodayString();
    
    setGameStats(prev => ({
      ...prev,
      gamePoints: prev.gamePoints + chargePoints,
      totalEarned: prev.totalEarned + chargePoints,
      emergencyCharges: prev.lastEmergencyCharge === today ? prev.emergencyCharges + 1 : 1,
      lastEmergencyCharge: today,
    }));

    const remaining = canUseEmergencyCharge() ? 1 : 0;
    alert(`🆘 긴급 충전 완료!\n${chargePoints}pt를 받았습니다!\n오늘 남은 긴급 충전: ${remaining}회`);
  };

  // 광고 시청 (시뮬레이션)
  const watchAd = () => {
    // 실제로는 광고 SDK 연동
    const adPoints = 30;
    
    // 2초 딜레이로 광고 시청 시뮬레이션
    const confirmWatch = window.confirm("광고를 시청하여 30pt를 받으시겠습니까? 📺");
    if (!confirmWatch) return;

    setTimeout(() => {
      setGameStats(prev => ({
        ...prev,
        gamePoints: prev.gamePoints + adPoints,
        totalEarned: prev.totalEarned + adPoints,
      }));
      alert(`📺 광고 시청 완료!\n${adPoints}pt를 받았습니다! 감사합니다! ✨`);
    }, 2000);
  };

  // 포인트 부족 시 충전 옵션 표시
  const showChargeOptions = () => {
    let options = [];
    
    if (canGetDailyBonus()) {
      options.push("📅 일일 보너스 (100pt)");
    }
    
    if (canUseEmergencyCharge()) {
      const remaining = gameStats.lastEmergencyCharge === getTodayString() ? 2 - gameStats.emergencyCharges : 2;
      options.push(`🆘 긴급 충전 (50pt) - 오늘 ${remaining}회 남음`);
    }
    
    options.push("📺 광고 시청 (30pt)");

    if (options.length === 1 && !canGetDailyBonus() && !canUseEmergencyCharge()) {
      // 광고만 남은 경우
      const watchAdConfirm = window.confirm("포인트가 부족합니다! 😅\n\n📺 광고를 시청하여 30pt를 받으시겠습니까?");
      if (watchAdConfirm) {
        watchAd();
      }
      return;
    }

    const choice = window.prompt(
      "포인트가 부족합니다! 어떻게 충전하시겠습니까? 🔋\n\n" +
      options.map((opt, i) => `${i + 1}. ${opt}`).join("\n") + 
      "\n\n번호를 입력하세요:"
    );

    const choiceNum = parseInt(choice || "0");
    if (choiceNum < 1 || choiceNum > options.length) return;

    let currentIndex = 1;
    
    if (canGetDailyBonus()) {
      if (choiceNum === currentIndex) {
        claimDailyBonus();
        return;
      }
      currentIndex++;
    }
    
    if (canUseEmergencyCharge()) {
      if (choiceNum === currentIndex) {
        useEmergencyCharge();
        return;
      }
      currentIndex++;
    }
    
    if (choiceNum === currentIndex) {
      watchAd();
    }
  };
  useEffect(() => {
    localStorage.setItem("lotto-game-stats", JSON.stringify(gameStats));
  }, [gameStats]);

  // 번호 맞추기 게임 시작
  const startGuessGame = () => {
    const secret = generateSecretNumbers();
    setGuessGame({
      secretNumbers: secret,
      userGuess: [],
      attempts: 0,
      maxAttempts: 8,
      hints: [],
      gameOver: false,
      won: false,
      score: 0,
      pointsEarned: 0,
    });
  };

  // 비밀 번호 생성
  const generateSecretNumbers = (): number[] => {
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  // 번호 맞추기 추측 제출
  const submitGuess = () => {
    if (guessGame.userGuess.length !== 6) return;

    const { secretNumbers, userGuess } = guessGame;
    const exactMatches = userGuess.filter((num, idx) => num === secretNumbers[idx]).length;
    const numberMatches = userGuess.filter(num => secretNumbers.includes(num)).length;
    const wrongPosition = numberMatches - exactMatches;

    let hint = "";
    if (exactMatches === 6) {
      const basePoints = 200;
      const bonusPoints = Math.max(0, (8 - guessGame.attempts) * 10);
      const totalPoints = basePoints + bonusPoints;
      
      hint = "🎉 축하합니다! 모든 번호를 맞췄어요!";
      setGuessGame(prev => ({
        ...prev,
        gameOver: true,
        won: true,
        score: Math.max(0, 1000 - (prev.attempts * 100)),
        pointsEarned: totalPoints,
        hints: [...prev.hints, hint, `🎁 ${totalPoints}pt 획득!`],
      }));
      
      setGameStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalWins: prev.totalWins + 1,
        guessGameWins: prev.guessGameWins + 1,
        gamePoints: prev.gamePoints + totalPoints,
        totalEarned: prev.totalEarned + totalPoints,
        bestScore: Math.max(prev.bestScore, Math.max(0, 1000 - (guessGame.attempts * 100))),
      }));
    } else {
      hint = `🎯 ${exactMatches}개 위치 정확 | 📍 ${wrongPosition}개 숫자 맞지만 위치 틀림`;
      
      const newAttempts = guessGame.attempts + 1;
      if (newAttempts >= guessGame.maxAttempts) {
        // 실패해도 참가상으로 10pt
        const consolationPoints = 10;
        setGuessGame(prev => ({
          ...prev,
          attempts: newAttempts,
          gameOver: true,
          won: false,
          pointsEarned: consolationPoints,
          hints: [...prev.hints, hint, `😔 실패! 정답: ${secretNumbers.join(", ")}`, `🎁 참가상 ${consolationPoints}pt 획득!`],
        }));
        
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          gamePoints: prev.gamePoints + consolationPoints,
          totalEarned: prev.totalEarned + consolationPoints,
        }));
      } else {
        setGuessGame(prev => ({
          ...prev,
          attempts: newAttempts,
          hints: [...prev.hints, hint],
          userGuess: [],
        }));
      }
    }
  };

  // 번호 확인 게임 시작
  const startSimulation = () => {
    if (gameStats.gamePoints < simulation.gameCost) {
      showChargeOptions();
      return;
    }

    if (simulation.selectedNumbers.length !== 6) {
      alert("6개 번호를 선택해주세요!");
      return;
    }

    setSimulation(prev => ({ ...prev, isPlaying: true }));
    
    // 랜덤한 과거 회차 선택
    const randomIndex = Math.floor(Math.random() * pastWinningNumbers.length);
    const winningNumbers = pastWinningNumbers[randomIndex].slice(0, 6);
    const bonusNumber = pastWinningNumbers[randomIndex][6];

    // 당첨 확인
    const matches = simulation.selectedNumbers.filter(num => winningNumbers.includes(num)).length;
    const bonusMatch = simulation.selectedNumbers.includes(bonusNumber);

    let grade = "";
    let points = 0;
    
    if (matches === 6) {
      grade = "1등";
      points = 1000;
    } else if (matches === 5 && bonusMatch) {
      grade = "2등";
      points = 300;
    } else if (matches === 5) {
      grade = "3등";
      points = 100;
    } else if (matches === 4) {
      grade = "4등";
      points = 50;
    } else if (matches === 3) {
      grade = "5등";
      points = 20;
    } else {
      grade = "낙첨";
      points = 0;
    }

    const result = {
      round: actualLatestRound - randomIndex,
      userNumbers: [...simulation.selectedNumbers],
      winningNumbers,
      bonusNumber,
      matches,
      bonusMatch,
      grade,
      points,
      used: simulation.gameCost,
      profit: points - simulation.gameCost,
    };

    setTimeout(() => {
      setSimulation(prev => ({
        ...prev,
        results: [result, ...prev.results.slice(0, 9)],
        isPlaying: false,
        selectedNumbers: [],
      }));

      setGameStats(prev => ({
        ...prev,
        gamePoints: prev.gamePoints - simulation.gameCost + points,
        totalUsed: prev.totalUsed + simulation.gameCost,
        totalEarned: prev.totalEarned + points,
        gamesPlayed: prev.gamesPlayed + 1,
        totalWins: points > 0 ? prev.totalWins + 1 : prev.totalWins,
        simulationWins: points > 0 ? prev.simulationWins + 1 : prev.simulationWins,
      }));

      if (points > 0) {
        alert(`🎉 ${grade} 당첨! ${points}포인트 획득!`);
      }
    }, 2000);
  };

  // 뽑기 게임 실행
  const pullGacha = () => {
    if (gameStats.gamePoints < gachaGame.pullCost) {
      showChargeOptions();
      return;
    }

    setGachaGame(prev => ({ ...prev, isOpening: true }));

    setTimeout(() => {
      // 확률에 따른 뽑기
      const rand = Math.random();
      let selectedItem: GachaItem;

      if (rand < 0.02) {
        // 2% 레전드
        selectedItem = gachaPool.filter(item => item.rarity === "legendary")[Math.floor(Math.random() * 2)];
      } else if (rand < 0.10) {
        // 8% 에픽
        selectedItem = gachaPool.filter(item => item.rarity === "epic")[Math.floor(Math.random() * 2)];
      } else if (rand < 0.30) {
        // 20% 레어
        selectedItem = gachaPool.filter(item => item.rarity === "rare")[Math.floor(Math.random() * 3)];
      } else {
        // 70% 일반
        selectedItem = gachaPool.filter(item => item.rarity === "common")[Math.floor(Math.random() * 4)];
      }

      setGachaGame(prev => ({
        ...prev,
        isOpening: false,
        lastPulled: selectedItem,
        inventory: [...prev.inventory, selectedItem],
      }));

      setGameStats(prev => ({
        ...prev,
        gamePoints: prev.gamePoints - gachaGame.pullCost + selectedItem.points,
        totalUsed: prev.totalUsed + gachaGame.pullCost,
        totalEarned: prev.totalEarned + selectedItem.points,
        gamesPlayed: prev.gamesPlayed + 1,
        gachaWins: prev.gachaWins + 1,
        collectedCombos: prev.collectedCombos.includes(selectedItem.id) 
          ? prev.collectedCombos 
          : [...prev.collectedCombos, selectedItem.id],
      }));

      const rarityText = {
        common: "일반",
        rare: "레어",
        epic: "에픽",
        legendary: "레전드"
      };

      alert(`🎁 ${rarityText[selectedItem.rarity]} 등급!\n"${selectedItem.name}" 획득!\n${selectedItem.points}pt 획득!`);
    }, 2000);
  };

  // 번호 선택/해제
  const toggleNumber = (num: number) => {
    if (selectedGame === "guess") {
      setGuessGame(prev => {
        if (prev.userGuess.includes(num)) {
          return { ...prev, userGuess: prev.userGuess.filter(n => n !== num) };
        } else if (prev.userGuess.length < 6) {
          return { ...prev, userGuess: [...prev.userGuess, num].sort((a, b) => a - b) };
        }
        return prev;
      });
    } else if (selectedGame === "simulation") {
      setSimulation(prev => {
        if (prev.selectedNumbers.includes(num)) {
          return { ...prev, selectedNumbers: prev.selectedNumbers.filter(n => n !== num) };
        } else if (prev.selectedNumbers.length < 6) {
          return { ...prev, selectedNumbers: [...prev.selectedNumbers, num].sort((a, b) => a - b) };
        }
        return prev;
      });
    }
  };

  // 자동 번호 생성
  const generateRandomNumbers = (target: "guess" | "simulation") => {
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    const randomNumbers = Array.from(numbers).sort((a, b) => a - b);

    if (target === "guess") {
      setGuessGame(prev => ({ ...prev, userGuess: randomNumbers }));
    } else {
      setSimulation(prev => ({ ...prev, selectedNumbers: randomNumbers }));
    }
  };

  // 희귀도별 색상
  const getRarityColor = (rarity: string) => {
    return currentColors[rarity as keyof typeof currentColors] || currentColors.common;
  };

  return (
    <div style={{ padding: "12px" }}>
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
            margin: "0 0 8px 0",
          }}
        >
          3가지 재미있는 게임으로 포인트를 모아보세요! 포인트가 부족하면 언제든 충전 가능! 🔋
        </p>

        {/* 게임 통계 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginTop: "12px",
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
              {gameStats.gamesPlayed}
            </div>

        {/* 포인트 충전 섹션 */}
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: currentColors.warning,
            borderRadius: "8px",
            border: `1px solid ${currentColors.warningBorder}`,
          }}
        >
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: currentColors.warningText,
              margin: "0 0 8px 0",
              textAlign: "center",
            }}
          >
            🔋 포인트 충전소
          </h4>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {canGetDailyBonus() && (
              <button
                onClick={claimDailyBonus}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center",
                  minWidth: "60px",
                }}
              >
                📅<br/>일일보너스<br/>+100pt
              </button>
            )}
            {canUseEmergencyCharge() && (
              <button
                onClick={useEmergencyCharge}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center",
                  minWidth: "60px",
                }}
              >
                🆘<br/>긴급충전<br/>+50pt
              </button>
            )}
            <button
              onClick={watchAd}
              style={{
                flex: 1,
                padding: "8px 6px",
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "center",
                minWidth: "60px",
              }}
            >
              📺<br/>광고시청<br/>+30pt
            </button>
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "9px",
              color: currentColors.warningText,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            {!canGetDailyBonus() && "일일보너스: 내일 가능 | "}
            긴급충전: 하루 2회 제한 | 광고: 무제한
          </div>
        </div>
            <div style={{ fontSize: "10px", color: currentColors.infoText }}>
              총 게임 수
            </div>
          </div>
          <div
            style={{
              padding: "8px",
              backgroundColor: currentColors.success,
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold", color: currentColors.successText }}>
              {gameStats.gamePoints}pt
            </div>
            <div style={{ fontSize: "10px", color: currentColors.successText }}>
              보유 포인트
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
              {gameStats.collectedCombos.length}/{gachaPool.length}
            </div>
            <div style={{ fontSize: "10px", color: currentColors.warningText }}>
              수집 도감
            </div>
          </div>
        </div>
      </div>

      {/* 게임 선택 */}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  setSelectedGame(game.id);
                  if (game.id === "guess") startGuessGame();
                }}
                disabled={isDataLoading || (game.id === "simulation" && gameStats.gamePoints < 10) || (game.id === "gacha" && gameStats.gamePoints < 20)}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.border}`,
                  backgroundColor: currentColors.surface,
                  cursor: isDataLoading || (game.id === "simulation" && gameStats.gamePoints < 10) || (game.id === "gacha" && gameStats.gamePoints < 20) ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  opacity: isDataLoading || (game.id === "simulation" && gameStats.gamePoints < 10) || (game.id === "gacha" && gameStats.gamePoints < 20) ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "32px" }}>{game.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: currentColors.text,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {game.name}
                    </h4>
                    <p
                      style={{
                        fontSize: "12px",
                        color: currentColors.textSecondary,
                        margin: "0 0 6px 0",
                      }}
                    >
                      {game.desc}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
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
                        {game.difficulty}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          backgroundColor: currentColors.accent,
                          color: "white",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        {game.earnPoints}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: currentColors.textSecondary,
                        }}
                      >
                        {(game.id === "simulation" && gameStats.gamePoints < 10) || (game.id === "gacha" && gameStats.gamePoints < 20)
                          ? "🔋 포인트 부족"
                          : "✨ 플레이 가능"
                        }
                      </span>
                    </div>
                  </div>
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

          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: currentColors.textSecondary, margin: "0 0 8px 0" }}>
              컴퓨터가 만든 비밀 번호 6개를 논리적으로 추론해보세요!
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "14px" }}>
              <span style={{ color: currentColors.primary, fontWeight: "bold" }}>
                시도: {guessGame.attempts}/{guessGame.maxAttempts}
              </span>
              <span style={{ color: currentColors.accent, fontWeight: "bold" }}>
                점수: {guessGame.score}
              </span>
              {guessGame.pointsEarned > 0 && (
                <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                  포인트: +{guessGame.pointsEarned}pt
                </span>
              )}
            </div>
          </div>

          {/* 번호 선택 grid */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
              번호를 선택하세요 ({guessGame.userGuess.length}/6)
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
                  disabled={guessGame.gameOver}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    border: guessGame.userGuess.includes(num) 
                      ? `2px solid ${currentColors.primary}` 
                      : `1px solid ${currentColors.border}`,
                    backgroundColor: guessGame.userGuess.includes(num) 
                      ? currentColors.primary 
                      : currentColors.surface,
                    color: guessGame.userGuess.includes(num) 
                      ? "white" 
                      : currentColors.text,
                    fontSize: "11px",
                    fontWeight: guessGame.userGuess.includes(num) ? "bold" : "normal",
                    cursor: guessGame.gameOver ? "not-allowed" : "pointer",
                    opacity: guessGame.gameOver ? 0.6 : 1,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* 선택된 번호 표시 */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
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
            </div>

            {/* 게임 버튼들 */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button
                onClick={() => generateRandomNumbers("guess")}
                disabled={guessGame.gameOver}
                style={{
                  padding: "8px 16px",
                  backgroundColor: currentColors.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: guessGame.gameOver ? "not-allowed" : "pointer",
                  opacity: guessGame.gameOver ? 0.6 : 1,
                }}
              >
                🎲 랜덤
              </button>
              <button
                onClick={submitGuess}
                disabled={guessGame.userGuess.length !== 6 || guessGame.gameOver}
                style={{
                  padding: "8px 16px",
                  backgroundColor: guessGame.userGuess.length === 6 ? currentColors.primary : currentColors.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: guessGame.userGuess.length === 6 && !guessGame.gameOver ? "pointer" : "not-allowed",
                }}
              >
                🎯 추측하기
              </button>
              {guessGame.gameOver && (
                <button
                  onClick={startGuessGame}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  🔄 다시하기
                </button>
              )}
            </div>
          </div>

          {/* 힌트 및 결과 */}
          {guessGame.hints.length > 0 && (
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
              {guessGame.hints.map((hint, index) => (
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
        </div>
      )}

      {/* 번호 확인 게임 */}
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
              🎲 번호 확인 게임
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

          {/* 게임 포인트 정보 */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: currentColors.primary }}>
              🎮 {gameStats.gamePoints}pt
            </div>
            <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>
              성공률: {gameStats.gamesPlayed > 0 
                ? `${((gameStats.simulationWins / gameStats.gamesPlayed) * 100).toFixed(1)}%`
                : "0%"
              }
            </div>
          </div>

          {simulation.isPlaying ? (
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
                🎲 번호 확인 중...
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
                  번호 선택하기 ({simulation.selectedNumbers.length}/6) - {simulation.gameCost}pt 사용
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
                        border: simulation.selectedNumbers.includes(num) 
                          ? `2px solid ${currentColors.primary}` 
                          : `1px solid ${currentColors.border}`,
                        backgroundColor: simulation.selectedNumbers.includes(num) 
                          ? currentColors.primary 
                          : currentColors.surface,
                        color: simulation.selectedNumbers.includes(num) 
                          ? "white" 
                          : currentColors.text,
                        fontSize: "11px",
                        fontWeight: simulation.selectedNumbers.includes(num) ? "bold" : "normal",
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
                    disabled={simulation.selectedNumbers.length !== 6 || gameStats.gamePoints < simulation.gameCost}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: simulation.selectedNumbers.length === 6 && gameStats.gamePoints >= simulation.gameCost
                        ? currentColors.primary 
                        : currentColors.textSecondary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: simulation.selectedNumbers.length === 6 && gameStats.gamePoints >= simulation.gameCost 
                        ? "pointer" 
                        : "not-allowed",
                    }}
                  >
                    🎮 게임 시작하기
                  </button>
                </div>
              </div>

              {/* 결과 기록 */}
              {simulation.results.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    📊 최근 게임 기록
                  </h4>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {simulation.results.map((result, index) => (
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
                            {result.round}회차 - {result.grade}
                          </span>
                          <span style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold",
                            color: result.profit > 0 ? currentColors.successText : currentColors.errorText,
                          }}>
                            {result.profit > 0 ? "+" : ""}{result.profit}pt
                          </span>
                        </div>
                        <div style={{ fontSize: "10px", color: currentColors.textSecondary }}>
                          내 번호: {result.userNumbers.join(", ")} | 당첨번호: {result.winningNumbers.join(", ")}+{result.bonusNumber}
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

      {/* 뽑기 게임 */}
      {selectedGame === "gacha" && (
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
              🎁 번호 뽑기 게임
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
              🎮 {gameStats.gamePoints}pt
            </div>
            <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>
              수집 완료: {gameStats.collectedCombos.length}/{gachaPool.length}개
            </div>
          </div>

          {gachaGame.isOpening ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  border: `4px solid ${currentColors.border}`,
                  borderTop: `4px solid #f59e0b`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: currentColors.text, fontSize: "16px", fontWeight: "bold" }}>
                🎁 캡슐 열어보는 중...
              </p>
              <p style={{ color: currentColors.textSecondary, fontSize: "12px" }}>
                어떤 번호 조합이 나올까요?
              </p>
            </div>
          ) : (
            <>
              {/* 뽑기 버튼 */}
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <button
                  onClick={pullGacha}
                  disabled={gameStats.gamePoints < gachaGame.pullCost}
                  style={{
                    padding: "16px 24px",
                    backgroundColor: gameStats.gamePoints >= gachaGame.pullCost ? "#f59e0b" : currentColors.textSecondary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: gameStats.gamePoints >= gachaGame.pullCost ? "pointer" : "not-allowed",
                    boxShadow: gameStats.gamePoints >= gachaGame.pullCost ? "0 4px 12px rgba(245, 158, 11, 0.4)" : "none",
                  }}
                >
                  🎁 캡슐 뽑기 ({gachaGame.pullCost}pt)
                </button>
              </div>

              {/* 확률 안내 */}
              <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: currentColors.gray, borderRadius: "8px" }}>
                <h4 style={{ fontSize: "12px", color: currentColors.text, margin: "0 0 8px 0" }}>
                  🎲 뽑기 확률
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", fontSize: "10px" }}>
                  <div style={{ textAlign: "center", color: currentColors.common }}>
                    <div>일반 70%</div>
                    <div>10-15pt</div>
                  </div>
                  <div style={{ textAlign: "center", color: currentColors.rare }}>
                    <div>레어 20%</div>
                    <div>50-60pt</div>
                  </div>
                  <div style={{ textAlign: "center", color: currentColors.epic }}>
                    <div>에픽 8%</div>
                    <div>120-150pt</div>
                  </div>
                  <div style={{ textAlign: "center", color: currentColors.legendary }}>
                    <div>레전드 2%</div>
                    <div>400-500pt</div>
                  </div>
                </div>
              </div>

              {/* 최근 뽑기 결과 */}
              {gachaGame.lastPulled && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    🎉 최근 뽑기 결과
                  </h4>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: currentColors.surface,
                      borderRadius: "8px",
                      border: `2px solid ${getRarityColor(gachaGame.lastPulled.rarity)}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: currentColors.text }}>
                        {gachaGame.lastPulled.name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          backgroundColor: getRarityColor(gachaGame.lastPulled.rarity),
                          color: "white",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        +{gachaGame.lastPulled.points}pt
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginBottom: "8px" }}>
                      {gachaGame.lastPulled.numbers.map((num, i) => (
                        <LottoNumberBall key={i} number={num} size="sm" theme={theme} />
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: currentColors.textSecondary, margin: "0", textAlign: "center" }}>
                      {gachaGame.lastPulled.description}
                    </p>
                  </div>
                </div>
              )}

              {/* 수집품 보기 버튼 */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setGachaGame(prev => ({ ...prev, showInventory: !prev.showInventory }))}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentColors.info,
                    color: currentColors.infoText,
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  📚 수집품 보기 ({gachaGame.inventory.length}개)
                </button>
              </div>

              {/* 수집품 목록 */}
              {gachaGame.showInventory && (
                <div style={{ marginTop: "16px", maxHeight: "200px", overflowY: "auto" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    📚 내 수집품
                  </h4>
                  {gachaGame.inventory.length === 0 ? (
                    <p style={{ textAlign: "center", color: currentColors.textSecondary, fontSize: "12px" }}>
                      아직 수집한 번호 조합이 없습니다
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {gachaGame.inventory.slice().reverse().map((item, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "8px",
                            backgroundColor: currentColors.gray,
                            borderRadius: "6px",
                            border: `1px solid ${getRarityColor(item.rarity)}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "bold", color: currentColors.text }}>
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                padding: "1px 6px",
                                backgroundColor: getRarityColor(item.rarity),
                                color: "white",
                                borderRadius: "3px",
                              }}
                            >
                              {item.rarity.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                            {item.numbers.map((num, i) => (
                              <div
                                key={i}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  backgroundColor: getRarityColor(item.rarity),
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                }}
                              >
                                {num}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
        `}
      </style>
    </div>
  );
};

export default MiniGame;
