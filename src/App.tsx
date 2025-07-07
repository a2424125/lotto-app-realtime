import React, { useState, useEffect } from "react";
import Dashboard from "./components/pages/Dashboard";
import Recommend from "./components/pages/Recommend";
import Stats from "./components/pages/Stats";
import Purchase from "./components/pages/Purchase";
import MiniGame from "./components/pages/MiniGame";
import Settings from "./components/pages/Settings";
import { lottoDataManager } from "./services/lottoDataManager";
import { LottoDrawResult } from "./types/lotto";

interface PurchaseItem {
  id: number;
  numbers: number[];
  strategy: string;
  date: string;
  checked: boolean;
  status: "saved" | "favorite" | "checked";
  memo?: string;
  purchaseDate?: string;
}

const LottoApp = () => {
  const [currentMenu, setCurrentMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseItem[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoSave, setAutoSave] = useState<boolean>(false);

  const [pastWinningNumbers, setPastWinningNumbers] = useState<number[][]>([]);
  
  const [roundRange, setRoundRange] = useState<{
    latestRound: number;
    oldestRound: number;
  }>({
    latestRound: 0,
    oldestRound: 0,
  });
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState<{
    lastUpdate: Date | null;
    isRealTime: boolean;
    source: "realtime_crawler" | "fallback";
    crawlerHealth?: string;
  }>({
    lastUpdate: null,
    isRealTime: false,
    source: "fallback",
    crawlerHealth: "checking",
  });

  const [nextDrawInfo, setNextDrawInfo] = useState<{
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
    isToday: boolean;
    timeUntilDraw: string;
    hasDrawPassed: boolean;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  const colors = {
    light: {
      background: "#f9fafb",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
    },
    dark: {
      background: "#0f172a",
      surface: "#1e293b",
      primary: "#3b82f6",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      accent: "#10b981",
    },
  };

  const currentColors = colors[theme];

  const menuItems = [
    { id: "dashboard", name: "🏠 홈" },
    { id: "recommend", name: "🎯 번호추천" },
    { id: "stats", name: "📊 통계분석" },
    { id: "purchase", name: "🛍️ 내번호함" },
    { id: "minigame", name: "🎮 미니게임" },
    { id: "settings", name: "⚙️ 설정" },
  ];

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("lotto-theme", newTheme);
  };

  const handleAutoSaveChange = (newAutoSave: boolean) => {
    setAutoSave(newAutoSave);
    localStorage.setItem("lotto-auto-save", newAutoSave.toString());
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("lotto-theme") as "light" | "dark";
    const savedAutoSave = localStorage.getItem("lotto-auto-save") === "true";

    if (savedTheme) {
      setTheme(savedTheme);
    }
    setAutoSave(savedAutoSave);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadRealtimeLottoData();
    loadNextDrawInfo();

    const interval = setInterval(() => {
      console.log("🔄 자동 데이터 새로고침...");
      loadRealtimeLottoData();
      loadNextDrawInfo();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadNextDrawInfo();
  }, [currentTime, roundRange]);

  // 🔧 수정: 더 많은 fallback 데이터 생성
const generateFallbackData = (): number[][] => {
  const currentDate = new Date();
  const startDate = new Date('2002-12-07');
  const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const estimatedRound = Math.max(1179, weeksSinceStart);
  
  const fallbackData: number[][] = [];
  
  // 🔧 전체 1179개 회차 생성 (50개가 아닌 전체)
  for (let i = 0; i < estimatedRound; i++) {
    const round = estimatedRound - i;
    const seed = round * 7919;
    const numbers = generateFallbackNumbers(seed);
    const bonusNumber = ((seed * 13) % 45) + 1;
    fallbackData.push([...numbers.sort((a, b) => a - b), bonusNumber]);
  }
  
  return fallbackData;
};

// loadRealtimeLottoData 함수의 fallback 부분도 수정
} catch (error) {
  console.error("❌ 실시간 데이터 로드 실패:", error);

  // 🔧 수정: 전체 fallback 데이터 생성
  const fallbackData = generateFallbackData();
  const currentDate = new Date();
  const startDate = new Date('2002-12-07');
  const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const estimatedRound = Math.max(1179, weeksSinceStart);
  
  setPastWinningNumbers(fallbackData);
  setRoundRange({
    latestRound: estimatedRound,
    oldestRound: 1, // 🔧 수정: 1회차부터
  });

  setDataStatus({
    lastUpdate: new Date(),
    isRealTime: false,
    source: "fallback",
    crawlerHealth: "error",
  });

  console.warn(`⚠️ 폴백 모드: ${estimatedRound}회 ~ 1회 (${estimatedRound}회차)`);
} finally {
  setIsDataLoading(false);
}
        
        // 🔧 1179회차 검증
        const round1179 = historyResponse.data.find((d: LottoDrawResult) => d.round === 1179);
        if (round1179) {
          console.log(`✅ 1179회차 확인: [${round1179.numbers.join(', ')}] + ${round1179.bonusNumber}`);
          const expected = [3, 16, 18, 24, 40, 44];
          const isCorrect = JSON.stringify(round1179.numbers) === JSON.stringify(expected) && round1179.bonusNumber === 21;
          console.log(`   예상값과 일치: ${isCorrect ? '✅ 성공' : '❌ 실패'}`);
        }
      } else {
        throw new Error(historyResponse.error || "데이터 없음");
      }
    } catch (error) {
      console.error("❌ 실시간 데이터 로드 실패:", error);

      // 🔧 수정: 더 많은 fallback 데이터 생성
      const fallbackData = generateFallbackData();
      const currentDate = new Date();
      const startDate = new Date('2002-12-07');
      const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const estimatedRound = Math.max(1179, weeksSinceStart);
      
      setPastWinningNumbers(fallbackData);
      setRoundRange({
        latestRound: estimatedRound,
        oldestRound: estimatedRound - 49, // 50개 회차
      });

      setDataStatus({
        lastUpdate: new Date(),
        isRealTime: false,
        source: "fallback",
        crawlerHealth: "error",
      });

      console.warn(`⚠️ 폴백 모드: ${estimatedRound}회 ~ ${estimatedRound - 49}회 (50회차)`);
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadNextDrawInfo = () => {
    try {
      console.log("📅 다음 추첨 정보 로딩...");
      
      const now = new Date();
      const drawInfo = calculateNextDrawInfo(now);
      
      // 🔧 수정: 정확한 현재 회차 계산
      // 기준: 2025년 7월 5일(토) = 1179회차 (추첨 완료)
      const referenceDate = new Date('2025-07-05');
      const referenceRound = 1179;
      
      // 기준일로부터 경과된 주 수 계산
      const timeDiff = now.getTime() - referenceDate.getTime();
      const weeksPassed = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
      
      // 현재까지 추첨 완료된 최신 회차
      let currentLatestRound = referenceRound + weeksPassed;
      
      // 🔧 중요: 다음 추첨 회차는 단순히 +1
      // 오늘이 일요일(2025.7.6)이므로 다음 토요일(2025.7.12)에 1180회차 추첨
      const nextRound = currentLatestRound + 1; // 1179 + 1 = 1180
      
      const nextInfo = {
        round: nextRound, // 🔧 수정: 1180회차가 올바른 다음 회차
        date: drawInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: drawInfo.daysUntilDraw,
        isToday: drawInfo.isToday,
        timeUntilDraw: drawInfo.timeUntilDraw,
        hasDrawPassed: drawInfo.hasDrawPassed,
      };
      
      setNextDrawInfo(nextInfo);
      console.log("📅 다음 추첨 정보:", nextInfo);
      console.log(`✅ 현재 완료된 최신 회차: ${currentLatestRound}, 다음 추첨: ${nextRound}회차`);
    } catch (error) {
      console.error("❌ 다음 추첨 정보 로드 실패:", error);
    }
  };

  const calculateNextDrawInfo = (currentDate: Date) => {
    const DRAW_DAY = 6;
    const DRAW_HOUR = 20;
    const DRAW_MINUTE = 35;

    const now = new Date(currentDate);
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const thisWeekSaturday = new Date(now);
    const daysToSaturday = (DRAW_DAY - currentDay + 7) % 7;
    thisWeekSaturday.setDate(now.getDate() + daysToSaturday);
    thisWeekSaturday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);

    if (currentDay === DRAW_DAY) {
      thisWeekSaturday.setDate(now.getDate());
      thisWeekSaturday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
    }

    const nextWeekSaturday = new Date(thisWeekSaturday);
    nextWeekSaturday.setDate(thisWeekSaturday.getDate() + 7);

    let nextDrawDate: Date;
    let isToday = false;
    let hasDrawPassed = false;

    if (currentDay === DRAW_DAY) {
      if (currentHour < DRAW_HOUR || (currentHour === DRAW_HOUR && currentMinute < DRAW_MINUTE)) {
        nextDrawDate = thisWeekSaturday;
        isToday = true;
        hasDrawPassed = false;
      } else {
        nextDrawDate = nextWeekSaturday;
        isToday = false;
        hasDrawPassed = true;
      }
    } else {
      if (daysToSaturday === 0) {
        nextDrawDate = nextWeekSaturday;
      } else {
        nextDrawDate = thisWeekSaturday;
      }
      isToday = false;
      hasDrawPassed = false;
    }

    const timeDiff = nextDrawDate.getTime() - now.getTime();
    const exactDaysUntilDraw = timeDiff <= 0 ? 0 : 
      nextDrawDate.toDateString() === now.toDateString() ? 0 : 
      Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let timeUntilDraw = "";
    if (timeDiff <= 0) {
      timeUntilDraw = "추첨 완료";
    } else if (isToday) {
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      if (hoursLeft > 0) {
        timeUntilDraw = `오늘 추첨! (${hoursLeft}시간 ${minutesLeft}분 후)`;
      } else {
        timeUntilDraw = `오늘 추첨! (${minutesLeft}분 후)`;
      }
    } else if (exactDaysUntilDraw === 1) {
      timeUntilDraw = "내일 추첨!";
    } else if (exactDaysUntilDraw === 0 && !isToday) {
      timeUntilDraw = "오늘 추첨!";
    } else {
      timeUntilDraw = `${exactDaysUntilDraw}일 후 추첨`;
    }

    return {
      nextDrawDate,
      daysUntilDraw: exactDaysUntilDraw,
      isToday,
      timeUntilDraw,
      hasDrawPassed,
    };
  };

  const refreshData = async () => {
    try {
      console.log("🔄 강제 새로고침 시작...");
      setIsDataLoading(true);

      const result = await lottoDataManager.forceUpdate();
      await loadRealtimeLottoData();
      loadNextDrawInfo();

      if (result.success) {
        alert("✅ 데이터가 업데이트되었습니다!\n" + result.message);
      } else {
        alert("⚠️ 일부 데이터 업데이트에 실패했습니다: " + result.message);
      }
    } catch (error) {
      console.error("❌ 강제 새로고침 오류:", error);
      alert("❌ 데이터 새로고침 중 오류가 발생했습니다.");
    }
  };

  const getMostFrequentNumbers = () => {
    if (pastWinningNumbers.length === 0) {
      return [7, 27, 38, 3, 6, 9, 14, 21, 28, 35, 42, 45, 1, 5, 13];
    }

    const frequency: { [key: number]: number } = {};
    pastWinningNumbers.forEach((numbers) => {
      numbers.slice(0, 6).forEach((num) => {
        frequency[num] = (frequency[num] || 0) + 1;
      });
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([num]) => parseInt(num));
  };

  const generate1stGradeNumbers = () => {
    const frequent = getMostFrequentNumbers().slice(0, 12);
    const numbers = new Set<number>();

    while (numbers.size < 4) {
      numbers.add(frequent[Math.floor(Math.random() * 8)]);
    }

    while (numbers.size < 6) {
      const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34];
      const candidate = fibonacci[Math.floor(Math.random() * fibonacci.length)];
      if (candidate <= 45) {
        numbers.add(candidate);
      } else {
        numbers.add(Math.floor(Math.random() * 45) + 1);
      }
    }

    return Array.from(numbers).sort((a, b) => a - b);
  };

  const addToPurchaseHistory = (numbers: number[], strategy: string) => {
    const newPurchase: PurchaseItem = {
      id: Date.now(),
      numbers,
      strategy,
      date: new Date().toLocaleDateString(),
      checked: false,
      status: "saved",
    };
    setPurchaseHistory((prev) => [newPurchase, ...prev]);

    if (autoSave) {
      console.log("✅ 자동저장 활성화: 번호가 자동으로 저장되었습니다.");
    }
  };

  const deletePurchaseItem = (id: number) => {
    setPurchaseHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const checkPurchaseItem = (id: number, numbers: number[]) => {
    setPurchaseHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: true } : item))
    );
  };

  const settingsProps = {
    onDataExport: () => {
      const data = {
        purchaseHistory,
        dataStatus: {
          ...dataStatus,
          crawlerVersion: "2.3.0",
          apiEndpoint: "realtime",
        },
        roundRange,
        nextDrawInfo,
        theme,
        autoSave,
        exportDate: new Date().toISOString(),
        version: "2.3.0",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lotto_data_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onDataImport: (data: any) => {
      if (data.purchaseHistory) {
        setPurchaseHistory(data.purchaseHistory);
      }
      if (data.nextDrawInfo) {
        setNextDrawInfo(data.nextDrawInfo);
      }
      if (data.roundRange) {
        setRoundRange(data.roundRange);
      }
      if (data.theme) {
        setTheme(data.theme);
        localStorage.setItem("lotto-theme", data.theme);
      }
      if (data.autoSave !== undefined) {
        setAutoSave(data.autoSave);
        localStorage.setItem("lotto-auto-save", data.autoSave.toString());
      }
    },
    onDataReset: () => {
      setPurchaseHistory([]);
      setNextDrawInfo(null);
    },
    onRefreshData: refreshData,
    onThemeChange: handleThemeChange,
    onAutoSaveChange: handleAutoSaveChange,
    currentTheme: theme,
    currentAutoSave: autoSave,
    dataStatus: {
      ...dataStatus,
      roundRange,
      nextDrawInfo,
      crawlerInfo: {
        version: "2.3.0",
        source: "en.lottolyzer.com",
        updateInterval: "5분",
        health: dataStatus.crawlerHealth,
      },
    },
  };

  const renderContent = () => {
    const commonProps = {
      pastWinningNumbers,
      roundRange,
      isDataLoading,
      dataStatus,
      theme,
    };

    switch (currentMenu) {
      case "dashboard":
        return (
          <Dashboard
            {...commonProps}
            onMenuChange={setCurrentMenu}
            generate1stGradeNumbers={generate1stGradeNumbers}
            onRefreshData={refreshData}
            nextDrawInfo={nextDrawInfo}
          />
        );
      case "recommend":
        return (
          <Recommend
            {...commonProps}
            onAddToPurchaseHistory={addToPurchaseHistory}
            autoSave={autoSave}
          />
        );
      case "stats":
        return <Stats {...commonProps} />;
      case "purchase":
        return (
          <Purchase
            purchaseHistory={purchaseHistory}
            onDelete={deletePurchaseItem}
            onCheck={checkPurchaseItem}
            onAdd={addToPurchaseHistory}
            pastWinningNumbers={pastWinningNumbers}
            theme={theme}
          />
        );
      case "minigame":
        return <MiniGame {...commonProps} />;
      case "settings":
        return <Settings {...settingsProps} />;
      default:
        return (
          <Dashboard
            {...commonProps}
            onMenuChange={setCurrentMenu}
            generate1stGradeNumbers={generate1stGradeNumbers}
            onRefreshData={refreshData}
            nextDrawInfo={nextDrawInfo}
          />
        );
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: currentColors.background,
        minHeight: "100vh",
        position: "relative",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: currentColors.text,
        transition: "all 0.3s ease",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          backgroundColor: currentColors.primary,
          color: "white",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            padding: "6px",
            backgroundColor: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          ☰
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
            로또 6/45
          </h1>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: dataStatus.isRealTime ? "#10b981" : dataStatus.source === "fallback" ? "#f59e0b" : "#ef4444",
              animation: isDataLoading ? "pulse 2s infinite" : "none",
            }}
            title={dataStatus.isRealTime ? "실시간 연동" : dataStatus.source === "fallback" ? "오프라인 모드" : "연결 오류"}
          />
          {nextDrawInfo && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                backgroundColor: nextDrawInfo.isToday ? "#ef4444" : 
                  nextDrawInfo.daysUntilDraw <= 1 ? "#f59e0b" : "#10b981",
                borderRadius: "4px",
                fontWeight: "bold",
                animation: nextDrawInfo.isToday || nextDrawInfo.daysUntilDraw <= 1 ? "pulse 2s infinite" : "none",
              }}
            >
              {nextDrawInfo.isToday ? "오늘 추첨!" : 
               nextDrawInfo.daysUntilDraw === 1 ? "내일 추첨!" :
               nextDrawInfo.daysUntilDraw === 0 ? "오늘 추첨!" :
               `${nextDrawInfo.daysUntilDraw}일 후`}
            </span>
          )}
          {autoSave && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                backgroundColor: "#10b981",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              💾
            </span>
          )}
        </div>
        <button
          onClick={refreshData}
          disabled={isDataLoading}
          style={{
            padding: "6px",
            backgroundColor: "transparent",
            border: "none",
            color: "white",
            cursor: isDataLoading ? "not-allowed" : "pointer",
            borderRadius: "4px",
            fontSize: "14px",
            opacity: isDataLoading ? 0.6 : 1,
            animation: isDataLoading ? "spin 2s linear infinite" : "none",
          }}
          title="실시간 데이터 새로고침"
        >
          🔄
        </button>
      </div>

      {/* 사이드바 */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: "240px",
              backgroundColor: currentColors.surface,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              color: currentColors.text,
            }}
          >
            <div
              style={{
                backgroundColor: currentColors.primary,
                color: "white",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
                  메뉴
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    padding: "6px",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: "8px" }}>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentMenu(item.id);
                    setSidebarOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px",
                    borderRadius: "6px",
                    textAlign: "left",
                    border: "none",
                    backgroundColor: currentMenu === item.id
                      ? theme === "dark" ? "#334155" : "#eff6ff"
                      : "transparent",
                    color: currentMenu === item.id ? currentColors.primary : currentColors.text,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>{item.name}</span>
                </button>
              ))}

              {/* 실시간 데이터 상태 정보 */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "8px",
                  backgroundColor: theme === "dark" ? "#334155" : "#f3f4f6",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                <div style={{ color: currentColors.textSecondary, marginBottom: "4px" }}>
                  📡 실시간 연동 상태
                </div>
                <div style={{ color: dataStatus.isRealTime ? "#059669" : "#d97706", fontWeight: "500" }}>
                  {dataStatus.isRealTime ? "🟢 실시간 연동" : "🟡 오프라인"}
                </div>
                {dataStatus.lastUpdate && (
                  <div style={{ color: currentColors.textSecondary, marginTop: "2px" }}>
                    업데이트: {dataStatus.lastUpdate.toLocaleTimeString()}
                  </div>
                )}
                
                <div
                  style={{
                    marginTop: "8px",
                    padding: "6px",
                    backgroundColor: theme === "dark" ? "#1e293b" : "#e0f2fe",
                    borderRadius: "4px",
                    border: theme === "dark" ? "1px solid #475569" : "1px solid #81d4fa",
                  }}
                >
                  <div
                    style={{
                      color: theme === "dark" ? "#38bdf8" : "#0277bd",
                      fontWeight: "500",
                      fontSize: "11px",
                    }}
                  >
                    📊 {roundRange.latestRound}~{roundRange.oldestRound}회차 ({pastWinningNumbers.length}개)
                  </div>
                </div>
                
                {nextDrawInfo && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "6px",
                      backgroundColor: theme === "dark" ? "#1e293b" : "#f0fdf4",
                      borderRadius: "4px",
                      border: theme === "dark" ? "1px solid #475569" : "1px solid #bbf7d0",
                    }}
                  >
                    <div
                      style={{
                        color: theme === "dark" ? "#4ade80" : "#166534",
                        fontWeight: "500",
                        fontSize: "11px",
                      }}
                    >
                      📅 다음 {nextDrawInfo.round}회차
                    </div>
                    <div style={{ color: theme === "dark" ? "#22c55e" : "#16a34a", fontSize: "10px" }}>
                      {nextDrawInfo.isToday ? "오늘 추첨!" :
                       nextDrawInfo.daysUntilDraw === 1 ? "내일 추첨!" :
                       nextDrawInfo.daysUntilDraw === 0 ? "오늘 추첨!" :
                       `${nextDrawInfo.daysUntilDraw}일 후`}
                    </div>
                  </div>
                )}
                
                {autoSave && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "6px",
                      backgroundColor: theme === "dark" ? "#134e4a" : "#f0fdf4",
                      borderRadius: "4px",
                      border: theme === "dark" ? "1px solid #047857" : "1px solid #bbf7d0",
                    }}
                  >
                    <div
                      style={{
                        color: theme === "dark" ? "#6ee7b7" : "#166534",
                        fontWeight: "500",
                        fontSize: "11px",
                      }}
                    >
                      💾 자동저장 활성화
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div style={{ paddingBottom: "56px" }}>
        {isDataLoading && (
          <div
            style={{
              position: "fixed",
              top: "60px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: currentColors.primary,
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              zIndex: 40,
            }}
          >
            🕷️ {roundRange.latestRound > 0 ? `${roundRange.latestRound}~${roundRange.oldestRound}회차` : "최신"} 실시간 크롤링 중...
          </div>
        )}
        {renderContent()}
      </div>

      {/* 푸터 */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "400px",
          backgroundColor: currentColors.surface,
          borderTop: `1px solid ${currentColors.border}`,
          padding: "8px 12px",
          textAlign: "center",
          fontSize: "10px",
          color: currentColors.textSecondary,
        }}
      >
        로또는 확률게임입니다. 과도한 구매는 가계에 부담이 됩니다.
        {dataStatus.source === "realtime_crawler" && roundRange.latestRound > 0 && (
          <span style={{ color: currentColors.accent, marginLeft: "8px" }}>
            • {roundRange.latestRound}~{roundRange.oldestRound}회차 실시간 연동
          </span>
        )}
        {nextDrawInfo && (
          <div style={{ color: "#dc2626", marginLeft: "8px", fontWeight: "bold", textAlign: "center" }}>
            • 다음 추첨{" "}
            {nextDrawInfo.isToday ? "오늘!" :
             nextDrawInfo.daysUntilDraw === 1 ? "내일!" :
             nextDrawInfo.daysUntilDraw === 0 ? "오늘!" :
             `${nextDrawInfo.daysUntilDraw}일 후`} ({nextDrawInfo.round}회차)
          </div>
        )}
      </div>

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

export default LottoApp;
