import React, { useState, useEffect, useRef } from "react";
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

// 🎯 타입 정의 (color를 별도로 관리)
interface BallPosition {
  x: number;
  y: number;
}

interface DrawGameState {
  ballPosition: BallPosition | null;
  ballColor: 'gold' | 'red' | 'blue' | 'purple' | 'green';
  isDrawing: boolean;
  drawnNumbers: number[];
  currentNumber: number | null;
  gameMode: 'lucky' | 'pattern' | 'memory';
  gameStarted: boolean;
  gameFinished: boolean;
  score: number;
  streak: number;
}

interface LuckyWheelGame {
  isSpinning: boolean;
  selectedNumber: number | null;
  spinDuration: number;
  angle: number;
}

interface PatternGame {
  currentPattern: number[];
  userPattern: number[];
  level: number;
  showPattern: boolean;
  gamePhase: 'showing' | 'input' | 'result';
}

interface MemoryGame {
  cards: { number: number; isFlipped: boolean; isMatched: boolean }[];
  selectedCards: number[];
  matches: number;
  attempts: number;
  showAll: boolean;
}

const MiniGame: React.FC<MiniGameProps> = ({
  pastWinningNumbers,
  isDataLoading = false,
  dataStatus,
  roundRange,
  theme = "light",
}) => {
  // 기본 상태
  const [activeGame, setActiveGame] = useState<'lucky' | 'pattern' | 'memory' | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // 럭키 드로우 게임 상태
  const [drawGame, setDrawGame] = useState<DrawGameState>({
    ballPosition: null,
    ballColor: 'gold',
    isDrawing: false,
    drawnNumbers: [],
    currentNumber: null,
    gameMode: 'lucky',
    gameStarted: false,
    gameFinished: false,
    score: 0,
    streak: 0,
  });

  // 럭키 휠 게임 상태
  const [wheelGame, setWheelGame] = useState<LuckyWheelGame>({
    isSpinning: false,
    selectedNumber: null,
    spinDuration: 3000,
    angle: 0,
  });

  // 패턴 맞추기 게임 상태
  const [patternGame, setPatternGame] = useState<PatternGame>({
    currentPattern: [],
    userPattern: [],
    level: 1,
    showPattern: false,
    gamePhase: 'showing',
  });

  // 메모리 게임 상태
  const [memoryGame, setMemoryGame] = useState<MemoryGame>({
    cards: [],
    selectedCards: [],
    matches: 0,
    attempts: 0,
    showAll: false,
  });

  // 실제 회차 범위 정보
  const actualLatestRound = roundRange?.latestRound || 1178;
  const actualOldestRound = roundRange?.oldestRound || 1178;
  const totalRounds = pastWinningNumbers.length;

  // ✅ 완전한 다크 모드 색상 테마
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
      gameCard: "#ffffff",
      gameBorder: "#e5e7eb",
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
      gameCard: "#1e293b",
      gameBorder: "#334155",
    },
  };

  const currentColors = colors[theme];

  // 게임 목록
  const games = [
    {
      id: 'lucky',
      name: '럭키 드로우',
      desc: '운명의 공 뽑기',
      emoji: '🎯',
      color: '#eab308',
    },
    {
      id: 'pattern',
      name: '패턴 맞추기',
      desc: '번호 순서 기억하기',
      emoji: '🧩',
      color: '#3b82f6',
    },
    {
      id: 'memory',
      name: '메모리 카드',
      desc: '같은 번호 찾기',
      emoji: '🃏',
      color: '#ef4444',
    },
  ];

  // 컴포넌트 마운트 시 하이스코어 로드
  useEffect(() => {
    const savedHighScore = localStorage.getItem('lotto-minigame-highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // 하이스코어 업데이트
  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('lotto-minigame-highscore', newScore.toString());
    }
  };

  // 🎯 럭키 드로우 게임 시작
  const startLuckyDraw = () => {
    setDrawGame({
      ballPosition: null,
      ballColor: 'gold',
      isDrawing: false,
      drawnNumbers: [],
      currentNumber: null,
      gameMode: 'lucky',
      gameStarted: true,
      gameFinished: false,
      score: 0,
      streak: 0,
    });
  };

  // 🎯 럭키 드로우 실행
  const performLuckyDraw = () => {
    if (drawGame.isDrawing) return;

    setDrawGame(prev => ({ ...prev, isDrawing: true }));

    // 공이 움직이는 애니메이션
    const colors: Array<'gold' | 'red' | 'blue' | 'purple' | 'green'> = ['gold', 'red', 'blue', 'purple', 'green'];
    let animationStep = 0;
    const maxSteps = 30;

    const animateInterval = setInterval(() => {
      animationStep++;
      
      setDrawGame(prev => ({
        ...prev,
        ballPosition: {
          x: Math.random() * 300,
          y: Math.random() * 200,
        },
        ballColor: colors[Math.floor(Math.random() * colors.length)]
      }));

      if (animationStep >= maxSteps) {
        clearInterval(animateInterval);
        
        // 최종 번호 선택
        const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1)
          .filter(num => !drawGame.drawnNumbers.includes(num));
        
        if (availableNumbers.length > 0) {
          const selectedNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
          
          setDrawGame(prev => ({
            ...prev,
            isDrawing: false,
            currentNumber: selectedNumber,
            drawnNumbers: [...prev.drawnNumbers, selectedNumber],
            ballPosition: {
              x: 150,
              y: 100,
            },
            ballColor: 'gold'
          }));

          // 점수 계산 (과거 당첨번호에 포함된 번호면 보너스)
          const isWinningNumber = pastWinningNumbers.some(draw => 
            draw.slice(0, 7).includes(selectedNumber)
          );
          
          if (isWinningNumber) {
            setDrawGame(prev => ({
              ...prev,
              score: prev.score + 100,
              streak: prev.streak + 1
            }));
          }
        }
      }
    }, 100);
  };

  // 🎮 패턴 게임 시작
  const startPatternGame = () => {
    const pattern = generateRandomPattern(3 + patternGame.level);
    setPatternGame({
      currentPattern: pattern,
      userPattern: [],
      level: 1,
      showPattern: true,
      gamePhase: 'showing',
    });

    // 패턴 보여주기
    setTimeout(() => {
      setPatternGame(prev => ({
        ...prev,
        showPattern: false,
        gamePhase: 'input',
      }));
    }, (3 + patternGame.level) * 800);
  };

  // 랜덤 패턴 생성
  const generateRandomPattern = (length: number): number[] => {
    const pattern: number[] = [];
    while (pattern.length < length) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!pattern.includes(num)) {
        pattern.push(num);
      }
    }
    return pattern;
  };

  // 패턴 게임 번호 선택
  const selectPatternNumber = (number: number) => {
    if (patternGame.gamePhase !== 'input') return;

    const newUserPattern = [...patternGame.userPattern, number];
    setPatternGame(prev => ({ ...prev, userPattern: newUserPattern }));

    // 패턴 완성 확인
    if (newUserPattern.length === patternGame.currentPattern.length) {
      const isCorrect = newUserPattern.every((num, index) => 
        num === patternGame.currentPattern[index]
      );

      setPatternGame(prev => ({ ...prev, gamePhase: 'result' }));

      if (isCorrect) {
        const levelScore = patternGame.level * 50;
        setGameScore(prev => prev + levelScore);
        updateHighScore(totalScore + levelScore);

        setTimeout(() => {
          // 다음 레벨
          const nextPattern = generateRandomPattern(3 + patternGame.level + 1);
          setPatternGame(prev => ({
            ...prev,
            currentPattern: nextPattern,
            userPattern: [],
            level: prev.level + 1,
            showPattern: true,
            gamePhase: 'showing',
          }));

          setTimeout(() => {
            setPatternGame(prev => ({
              ...prev,
              showPattern: false,
              gamePhase: 'input',
            }));
          }, (4 + patternGame.level) * 800);
        }, 1500);
      }
    }
  };

  // 🃏 메모리 게임 시작
  const startMemoryGame = () => {
    const numbers = Array.from({ length: 16 }, (_, i) => (i % 8) + 1);
    const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
    
    const cards = shuffledNumbers.map((number, index) => ({
      number,
      isFlipped: false,
      isMatched: false,
    }));

    setMemoryGame({
      cards,
      selectedCards: [],
      matches: 0,
      attempts: 0,
      showAll: false,
    });

    // 처음에 모든 카드 보여주기
    setMemoryGame(prev => ({ ...prev, showAll: true }));
    setTimeout(() => {
      setMemoryGame(prev => ({ ...prev, showAll: false }));
    }, 3000);
  };

  // 메모리 게임 카드 선택
  const selectMemoryCard = (cardIndex: number) => {
    if (memoryGame.selectedCards.length >= 2) return;
    if (memoryGame.cards[cardIndex].isFlipped || memoryGame.cards[cardIndex].isMatched) return;

    const newSelectedCards = [...memoryGame.selectedCards, cardIndex];
    const newCards = [...memoryGame.cards];
    newCards[cardIndex].isFlipped = true;

    setMemoryGame(prev => ({
      ...prev,
      selectedCards: newSelectedCards,
      cards: newCards,
    }));

    if (newSelectedCards.length === 2) {
      const [first, second] = newSelectedCards;
      const isMatch = memoryGame.cards[first].number === memoryGame.cards[second].number;

      setTimeout(() => {
        const finalCards = [...newCards];
        
        if (isMatch) {
          finalCards[first].isMatched = true;
          finalCards[second].isMatched = true;
          
          setMemoryGame(prev => ({
            ...prev,
            cards: finalCards,
            selectedCards: [],
            matches: prev.matches + 1,
            attempts: prev.attempts + 1,
          }));

          const newMatches = memoryGame.matches + 1;
          if (newMatches === 8) {
            const finalScore = Math.max(0, 1000 - memoryGame.attempts * 10);
            setGameScore(prev => prev + finalScore);
            updateHighScore(totalScore + finalScore);
          }
        } else {
          finalCards[first].isFlipped = false;
          finalCards[second].isFlipped = false;
          
          setMemoryGame(prev => ({
            ...prev,
            cards: finalCards,
            selectedCards: [],
            attempts: prev.attempts + 1,
          }));
        }
      }, 1000);
    }
  };

  // 게임 초기화
  const resetGame = () => {
    setActiveGame(null);
    setGameScore(0);
    setDrawGame({
      ballPosition: null,
      ballColor: 'gold',
      isDrawing: false,
      drawnNumbers: [],
      currentNumber: null,
      gameMode: 'lucky',
      gameStarted: false,
      gameFinished: false,
      score: 0,
      streak: 0,
    });
    setPatternGame({
      currentPattern: [],
      userPattern: [],
      level: 1,
      showPattern: false,
      gamePhase: 'showing',
    });
    setMemoryGame({
      cards: [],
      selectedCards: [],
      matches: 0,
      attempts: 0,
      showAll: false,
    });
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
            margin: "0 0 16px 0",
          }}
        >
          재미있는 게임으로 로또 번호에 친숙해져보세요!
        </p>

        {/* 점수판 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              padding: "12px",
              backgroundColor: currentColors.success,
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${currentColors.successBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.successText,
              }}
            >
              {gameScore}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: currentColors.successText,
              }}
            >
              현재 점수
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: currentColors.info,
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${currentColors.infoBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.infoText,
              }}
            >
              {totalScore}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: currentColors.infoText,
              }}
            >
              총 점수
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: currentColors.warning,
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${currentColors.warningBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.warningText,
              }}
            >
              {highScore}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: currentColors.warningText,
              }}
            >
              최고 점수
            </div>
          </div>
        </div>

        {/* 게임 선택 또는 초기화 버튼 */}
        {activeGame ? (
          <button
            onClick={resetGame}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: currentColors.textSecondary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🏠 게임 선택으로 돌아가기
          </button>
        ) : null}
      </div>

      {/* 게임 선택 */}
      {!activeGame && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "12px",
          }}
        >
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id as any)}
              style={{
                padding: "20px",
                backgroundColor: currentColors.gameCard,
                border: `2px solid ${currentColors.gameBorder}`,
                borderRadius: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                    width: "60px",
                    height: "60px",
                    backgroundColor: game.color,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {game.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {game.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: currentColors.textSecondary,
                      margin: "0",
                    }}
                  >
                    {game.desc}
                  </p>
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    color: currentColors.textSecondary,
                  }}
                >
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 럭키 드로우 게임 */}
      {activeGame === 'lucky' && (
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "20px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 16px 0",
              textAlign: "center",
            }}
          >
            🎯 럭키 드로우
          </h3>

          {/* 게임 영역 */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "250px",
              backgroundColor: currentColors.gray,
              borderRadius: "12px",
              border: `2px dashed ${currentColors.grayBorder}`,
              marginBottom: "16px",
              overflow: "hidden",
            }}
          >
            {drawGame.ballPosition && (
              <div
                style={{
                  position: "absolute",
                  left: `${drawGame.ballPosition.x}px`,
                  top: `${drawGame.ballPosition.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: drawGame.ballColor === 'gold' ? '#fbbf24' :
                                 drawGame.ballColor === 'red' ? '#ef4444' :
                                 drawGame.ballColor === 'blue' ? '#3b82f6' :
                                 drawGame.ballColor === 'purple' ? '#8b5cf6' : '#10b981',
                  transition: drawGame.isDrawing ? "none" : "all 0.5s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              />
            )}

            {/* 현재 번호 표시 */}
            {drawGame.currentNumber && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <LottoNumberBall
                  number={drawGame.currentNumber}
                  size="lg"
                  theme={theme}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: currentColors.text,
                    fontWeight: "bold",
                  }}
                >
                  행운의 번호!
                </span>
              </div>
            )}
          </div>

          {/* 뽑힌 번호들 */}
          {drawGame.drawnNumbers.length > 0 && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: currentColors.success,
                borderRadius: "8px",
                border: `1px solid ${currentColors.successBorder}`,
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  color: currentColors.successText,
                  margin: "0 0 8px 0",
                }}
              >
                뽑힌 번호들:
              </h4>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                {drawGame.drawnNumbers.map((num, index) => (
                  <LottoNumberBall
                    key={index}
                    number={num}
                    size="sm"
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 게임 컨트롤 */}
          <div style={{ textAlign: "center" }}>
            {!drawGame.gameStarted ? (
              <button
                onClick={startLuckyDraw}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#eab308",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(234, 179, 8, 0.4)",
                }}
              >
                🎯 게임 시작
              </button>
            ) : (
              <button
                onClick={performLuckyDraw}
                disabled={drawGame.isDrawing || drawGame.drawnNumbers.length >= 6}
                style={{
                  padding: "12px 24px",
                  backgroundColor: drawGame.isDrawing ? currentColors.textSecondary : "#eab308",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: drawGame.isDrawing ? "not-allowed" : "pointer",
                  boxShadow: drawGame.isDrawing ? "none" : "0 4px 12px rgba(234, 179, 8, 0.4)",
                }}
              >
                {drawGame.isDrawing ? "🎲 뽑는 중..." : "🎲 번호 뽑기"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 패턴 맞추기 게임 */}
      {activeGame === 'pattern' && (
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "20px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 16px 0",
              textAlign: "center",
            }}
          >
            🧩 패턴 맞추기 (레벨 {patternGame.level})
          </h3>

          {patternGame.currentPattern.length === 0 ? (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={startPatternGame}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                }}
              >
                🧩 게임 시작
              </button>
            </div>
          ) : (
            <>
              {/* 패턴 표시 영역 */}
              <div
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  backgroundColor: patternGame.showPattern ? currentColors.info : currentColors.gray,
                  borderRadius: "8px",
                  border: `1px solid ${patternGame.showPattern ? currentColors.infoBorder : currentColors.grayBorder}`,
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    color: patternGame.showPattern ? currentColors.infoText : currentColors.textSecondary,
                    margin: "0 0 12px 0",
                  }}
                >
                  {patternGame.showPattern ? "패턴을 기억하세요!" : "패턴을 입력하세요:"}
                </h4>
                
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {patternGame.showPattern ? (
                    patternGame.currentPattern.map((num, index) => (
                      <LottoNumberBall
                        key={index}
                        number={num}
                        size="md"
                        theme={theme}
                      />
                    ))
                  ) : (
                    patternGame.userPattern.map((num, index) => (
                      <LottoNumberBall
                        key={index}
                        number={num}
                        size="md"
                        isMatched={num === patternGame.currentPattern[index]}
                        theme={theme}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* 번호 선택 영역 */}
              {patternGame.gamePhase === 'input' && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(9, 1fr)",
                    gap: "4px",
                    marginBottom: "16px",
                  }}
                >
                  {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => selectPatternNumber(num)}
                      disabled={patternGame.userPattern.includes(num)}
                      style={{
                        padding: "8px 4px",
                        backgroundColor: patternGame.userPattern.includes(num) 
                          ? currentColors.textSecondary 
                          : currentColors.surface,
                        border: `1px solid ${currentColors.border}`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: patternGame.userPattern.includes(num) ? "not-allowed" : "pointer",
                        color: patternGame.userPattern.includes(num) 
                          ? "white" 
                          : currentColors.text,
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 메모리 카드 게임 */}
      {activeGame === 'memory' && (
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "20px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: currentColors.text,
              margin: "0 0 16px 0",
              textAlign: "center",
            }}
          >
            🃏 메모리 카드 게임
          </h3>

          {memoryGame.cards.length === 0 ? (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={startMemoryGame}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                }}
              >
                🃏 게임 시작
              </button>
            </div>
          ) : (
            <>
              {/* 게임 상태 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: currentColors.textSecondary,
                }}
              >
                <span>매치: {memoryGame.matches}/8</span>
                <span>시도: {memoryGame.attempts}</span>
              </div>

              {/* 카드 그리드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
                }}
              >
                {memoryGame.cards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => selectMemoryCard(index)}
                    disabled={card.isMatched || card.isFlipped}
                    style={{
                      aspectRatio: "1",
                      backgroundColor: card.isMatched 
                        ? currentColors.success 
                        : card.isFlipped || memoryGame.showAll
                        ? currentColors.info
                        : currentColors.gray,
                      border: `2px solid ${
                        card.isMatched 
                          ? currentColors.successBorder 
                          : card.isFlipped || memoryGame.showAll
                          ? currentColors.infoBorder
                          : currentColors.grayBorder
                      }`,
                      borderRadius: "8px",
                      cursor: card.isMatched || card.isFlipped ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: card.isMatched 
                        ? currentColors.successText 
                        : card.isFlipped || memoryGame.showAll
                        ? currentColors.infoText
                        : "transparent",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {card.isFlipped || card.isMatched || memoryGame.showAll ? card.number : "?"}
                  </button>
                ))}
              </div>

              {/* 게임 완료 메시지 */}
              {memoryGame.matches === 8 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    backgroundColor: currentColors.success,
                    borderRadius: "8px",
                    border: `1px solid ${currentColors.successBorder}`,
                    textAlign: "center",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "16px",
                      color: currentColors.successText,
                      margin: "0 0 8px 0",
                    }}
                  >
                    🎉 게임 완료!
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: currentColors.successText,
                      margin: "0",
                    }}
                  >
                    {memoryGame.attempts}번 시도로 완성! 점수: {Math.max(0, 1000 - memoryGame.attempts * 10)}점
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniGame;
