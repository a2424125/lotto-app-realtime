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
  virtualMoney: number;
  totalSpent: number;
  totalWon: number;
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
      virtualMoney: 100000, // 시작 자금 10만원
      totalSpent: 0,
      totalWon: 0,
    };
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
  });

  // 가상 로또 시뮬레이션 상태
  const [simulation, setSimulation] = useState({
    selectedNumbers: [] as number[],
    ticketPrice: 1000,
    currentRound: 0,
    results: [] as any[],
    isPlaying: false,
    autoPlay: false,
    speed: 1,
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

  // 게임 목록
  const games = [
    {
      id: "guess",
      name: "번호맞추기",
      desc: "AI가 만든 비밀번호를 힌트로 맞춰보세요!",
      emoji: "🎯",
      color: currentColors.primary,
      difficulty: "중급",
    },
    {
      id: "simulation",
      name: "가상 로또 시뮬",
      desc: "가상 돈으로 로또를 사서 실제 결과로 확인!",
      emoji: "🎲",
      color: "#8b5cf6",
      difficulty: "초급",
    },
  ];

  // 게임 통계 저장
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
      maxAttempts: 10,
      hints: [],
      gameOver: false,
      won: false,
      score: 0,
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
      hint = "🎉 축하합니다! 모든 번호를 맞췄어요!";
      setGuessGame(prev => ({
        ...prev,
        gameOver: true,
        won: true,
        score: Math.max(0, 1000 - (prev.attempts * 100)),
        hints: [...prev.hints, hint],
      }));
      
      setGameStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalWins: prev.totalWins + 1,
        bestScore: Math.max(prev.bestScore, Math.max(0, 1000 - (guessGame.attempts * 100))),
      }));
    } else {
      hint = `🎯 ${exactMatches}개 위치 정확 | 📍 ${wrongPosition}개 숫자 맞지만 위치 틀림`;
      
      const newAttempts = guessGame.attempts + 1;
      if (newAttempts >= guessGame.maxAttempts) {
        setGuessGame(prev => ({
          ...prev,
          attempts: newAttempts,
          gameOver: true,
          won: false,
          hints: [...prev.hints, hint, `😔 실패! 정답: ${secretNumbers.join(", ")}`],
        }));
        
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
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

  // 가상 로또 시뮬레이션 시작
  const startSimulation = () => {
    if (gameStats.virtualMoney < simulation.ticketPrice) {
      alert("가상 돈이 부족합니다! 🪙");
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
    let prize = 0;
    
    if (matches === 6) {
      grade = "1등";
      prize = Math.floor(Math.random() * 1000000000) + 1000000000; // 10억~20억
    } else if (matches === 5 && bonusMatch) {
      grade = "2등";
      prize = Math.floor(Math.random() * 50000000) + 30000000; // 3000만~8000만
    } else if (matches === 5) {
      grade = "3등";
      prize = Math.floor(Math.random() * 500000) + 1000000; // 100만~150만
    } else if (matches === 4) {
      grade = "4등";
      prize = 50000;
    } else if (matches === 3) {
      grade = "5등";
      prize = 5000;
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
      spent: simulation.ticketPrice,
      profit: prize - simulation.ticketPrice,
    };

    setTimeout(() => {
      setSimulation(prev => ({
        ...prev,
        results: [result, ...prev.results.slice(0, 9)], // 최근 10개만 유지
        isPlaying: false,
        selectedNumbers: [],
      }));

      setGameStats(prev => ({
        ...prev,
        virtualMoney: prev.virtualMoney - simulation.ticketPrice + prize,
        totalSpent: prev.totalSpent + simulation.ticketPrice,
        totalWon: prev.totalWon + prize,
        gamesPlayed: prev.gamesPlayed + 1,
        totalWins: prize > 0 ? prev.totalWins + 1 : prev.totalWins,
      }));

      if (prize > 0) {
        alert(`🎉 ${grade} 당첨! ${prize.toLocaleString()}원 획득!`);
      }
    }, 2000);
  };

  // 번호 선택/해제 (시뮬레이션용)
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
          재미있는 로또 게임으로 운을 시험해보세요!
        </p>

        {/* 게임 통계 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
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
              {gameStats.virtualMoney.toLocaleString()}원
            </div>
            <div style={{ fontSize: "10px", color: currentColors.successText }}>
              보유 가상머니
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
                disabled={isDataLoading}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.border}`,
                  backgroundColor: currentColors.surface,
                  cursor: isDataLoading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  opacity: isDataLoading ? 0.6 : 1,
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
                          color: currentColors.textSecondary,
                        }}
                      >
                        {game.id === "simulation" && gameStats.virtualMoney < 1000
                          ? "💰 잔액 부족"
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
              AI가 만든 비밀 번호 6개를 맞춰보세요!
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "14px" }}>
              <span style={{ color: currentColors.primary, fontWeight: "bold" }}>
                시도: {guessGame.attempts}/{guessGame.maxAttempts}
              </span>
              <span style={{ color: currentColors.accent, fontWeight: "bold" }}>
                점수: {guessGame.score}
              </span>
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

          {/* 가상 머니 정보 */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: currentColors.primary }}>
              💰 {gameStats.virtualMoney.toLocaleString()}원
            </div>
            <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>
              수익률: {gameStats.totalSpent > 0 
                ? `${(((gameStats.totalWon - gameStats.totalSpent) / gameStats.totalSpent) * 100).toFixed(1)}%`
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
                  로또 번호 선택 ({simulation.selectedNumbers.length}/6) - {simulation.ticketPrice.toLocaleString()}원
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
                    disabled={simulation.selectedNumbers.length !== 6 || gameStats.virtualMoney < simulation.ticketPrice}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: simulation.selectedNumbers.length === 6 && gameStats.virtualMoney >= simulation.ticketPrice
                        ? currentColors.primary 
                        : currentColors.textSecondary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: simulation.selectedNumbers.length === 6 && gameStats.virtualMoney >= simulation.ticketPrice 
                        ? "pointer" 
                        : "not-allowed",
                    }}
                  >
                    🎫 로또 구매하기
                  </button>
                </div>
              </div>

              {/* 결과 기록 */}
              {simulation.results.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: currentColors.text, margin: "0 0 8px 0" }}>
                    📊 최근 게임 결과
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
                            {result.profit > 0 ? "+" : ""}{result.profit.toLocaleString()}원
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
