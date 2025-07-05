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
  purchaseDate?: string;
}

const LottoApp = () => {
  // 기존 상태들 (그대로 유지)
  const [currentMenu, setCurrentMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseItem[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoSave, setAutoSave] = useState<boolean>(false);

  // 🆕 실시간 데이터 상태들
  const [pastWinningNumbers, setPastWinningNumbers] = useState<number[][]>([
    [3, 7, 15, 16, 19, 43, 21], // 기본값 (폴백)
  ]);
  const [roundRange, setRoundRange] = useState<{
    latestRound: number;
    oldestRound: number;
  }>({
    latestRound: 1178,
    oldestRound: 1178,
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

  // 다음 추첨 정보 상태
  const [nextDrawInfo, setNextDrawInfo] = useState<{
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
    isToday: boolean;
    timeUntilDraw: string;
    hasDrawPassed: boolean;
  } | null>(null);

  // 🆕 실시간 업데이트용 타이머
  const [currentTime, setCurrentTime] = useState(new Date());

  // 다크 모드 색상 테마 (기존과 동일)
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

  // 메뉴 아이템 배열 (기존과 동일)
  const menuItems = [
    { id: "dashboard", name: "🏠 홈" },
    { id: "recommend", name: "🎯 번호추천" },
    { id: "stats", name: "📊 통계분석" },
    { id: "purchase", name: "🛍️ 내번호함" },
    { id: "minigame", name: "🎮 미니게임" },
    { id: "settings", name: "⚙️ 설정" },
  ];

  // 테마 변경 함수 (기존과 동일)
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("lotto-theme", newTheme);
  };

  // 자동저장 설정 변경 함수 (기존과 동일)
  const handleAutoSaveChange = (newAutoSave: boolean) => {
    setAutoSave(newAutoSave);
    localStorage.setItem("lotto-auto-save", newAutoSave.toString());
  };

  // 컴포넌트 마운트 시 설정 불러오기 (기존과 동일)
  useEffect(() => {
    const savedTheme = localStorage.getItem("lotto-theme") as "light" | "dark";
    const savedAutoSave = localStorage.getItem("lotto-auto-save") === "true";

    if (savedTheme) {
      setTheme(savedTheme);
    }
    setAutoSave(savedAutoSave);
  }, []);

  // 🆕 실시간 시간 업데이트 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 🚀 실시간 로또 데이터 로드
  useEffect(() => {
    loadRealtimeLottoData();
    loadNextDrawInfo();

    // 🕐 10분마다 자동 새로고침
    const interval = setInterval(() => {
      console.log("🔄 자동 데이터 새로고침...");
      loadRealtimeLottoData();
      loadNextDrawInfo();
    }, 10 * 60 * 1000); // 10분

    return () => clearInterval(interval);
  }, []);

  // 📅 추첨일 정보 실시간 업데이트
  useEffect(() => {
    loadNextDrawInfo();
  }, [currentTime, roundRange]);

  // 📡 실시간 데이터 로딩
  const loadRealtimeLottoData = async () => {
    setIsDataLoading(true);
    try {
      console.log("🔄 실시간 로또 데이터 로딩...");

      // 🎯 헬스체크부터 수행
      const health = await lottoDataManager.checkHealth();

      // 📊 전체 데이터 가져오기 - 최대한 많이
      const historyResponse = await lottoDataManager.getHistory(1200);

      if (historyResponse.success && historyResponse.data) {
        // 기존 형식으로 변환 (6개 당첨번호 + 1개 보너스번호)
        const formattedData = historyResponse.data.map(
          (result: LottoDrawResult) => [...result.numbers, result.bonusNumber]
        );

        // 🔧 실제 회차 범위 계산 (실제 데이터 기반)
        if (historyResponse.data.length > 0) {
          const latestRound = historyResponse.data[0].round;
          const oldestRound =
            historyResponse.data[historyResponse.data.length - 1].round;

          setRoundRange({ latestRound, oldestRound });
          console.log(
            `📊 실시간 데이터 범위: ${latestRound}회 ~ ${oldestRound}회 (총 ${historyResponse.data.length}회차)`
          );
        }

        setPastWinningNumbers(formattedData);
        setDataStatus({
          lastUpdate: new Date(),
          isRealTime: true,
          source: "realtime_crawler",
          crawlerHealth: health.status || "unknown",
        });

        console.log(
          "✅ 실시간 데이터 로드 완료:",
          formattedData.length,
          "회차"
        );
      } else {
        throw new Error(historyResponse.error || "실시간 데이터 로드 실패");
      }
    } catch (error) {
      console.error("❌ 실시간 데이터 로드 실패:", error);

      // 폴백 처리
      setRoundRange({
        latestRound: 1178,
        oldestRound: 1178,
      });

      setDataStatus({
        lastUpdate: new Date(),
        isRealTime: false,
        source: "fallback",
        crawlerHealth: "error",
      });

      // 에러 메시지 표시 (사용자에게 알림)
      console.warn(
        "⚠️ 실시간 데이터를 불러올 수 없어 오프라인 모드로 전환됩니다."
      );
    } finally {
      setIsDataLoading(false);
    }
  };

  // 📅 🔧 완전히 수정된 다음 추첨 정보 로드 - 정확한 시간 계산
  const loadNextDrawInfo = () => {
    try {
      console.log("📅 다음 추첨 정보 로딩...");
      
      const now = new Date();
      const drawInfo = calculateNextDrawInfo(now);
      
      const nextInfo = {
        round: roundRange.latestRound + 1,
        date: drawInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: drawInfo.daysUntilDraw,
        isToday: drawInfo.isToday,
        timeUntilDraw: drawInfo.timeUntilDraw,
        hasDrawPassed: drawInfo.hasDrawPassed,
      };
      
      setNextDrawInfo(nextInfo);
      console.log("📅 다음 추첨 정보 로드 완료:", nextInfo);
    } catch (error) {
      console.error("❌ 다음 추첨 정보 로드 실패:", error);
      // 폴백 정보 계산
      const now = new Date();
      const fallbackInfo = calculateNextDrawInfo(now);
      setNextDrawInfo({
        round: roundRange.latestRound + 1,
        date: fallbackInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: fallbackInfo.daysUntilDraw,
        isToday: fallbackInfo.isToday,
        timeUntilDraw: fallbackInfo.timeUntilDraw,
        hasDrawPassed: fallbackInfo.hasDrawPassed,
      });
    }
  };

  // 🔧 완전히 새로운 추첨일 계산 함수 - 매우 정확한 계산
  const calculateNextDrawInfo = (currentDate: Date) => {
    // 로또 추첨: 매주 토요일 오후 8시 35분
    const DRAW_DAY = 6; // 토요일 (0: 일요일, 6: 토요일)
    const DRAW_HOUR = 20; // 오후 8시
    const DRAW_MINUTE = 35; // 35분

    const now = new Date(currentDate);
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 이번 주 토요일 추첨 시간 계산
    const thisWeekSaturday = new Date(now);
    const daysToSaturday = (DRAW_DAY - currentDay + 7) % 7;
    thisWeekSaturday.setDate(now.getDate() + daysToSaturday);
    thisWeekSaturday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);

    // 만약 오늘이 토요일이라면
    if (currentDay === DRAW_DAY) {
      thisWeekSaturday.setDate(now.getDate()); // 오늘로 설정
      thisWeekSaturday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
    }

    // 다음 주 토요일 추첨 시간 계산
    const nextWeekSaturday = new Date(thisWeekSaturday);
    nextWeekSaturday.setDate(thisWeekSaturday.getDate() + 7);

    let nextDrawDate: Date;
    let isToday = false;
    let hasDrawPassed = false;

    // 추첨 시간 결정 로직
    if (currentDay === DRAW_DAY) {
      // 오늘이 토요일인 경우
      if (currentHour < DRAW_HOUR || (currentHour === DRAW_HOUR && currentMinute < DRAW_MINUTE)) {
        // 추첨 시간 전 - 오늘 추첨
        nextDrawDate = thisWeekSaturday;
        isToday = true;
        hasDrawPassed = false;
      } else {
        // 추첨 시간 후 - 다음 주 토요일 추첨
        nextDrawDate = nextWeekSaturday;
        isToday = false;
        hasDrawPassed = true;
      }
    } else {
      // 오늘이 토요일이 아닌 경우
      if (daysToSaturday === 0) {
        // 이미 이번 주 토요일이 지났으면 다음 주
        nextDrawDate = nextWeekSaturday;
      } else {
        // 이번 주 토요일이 아직 오지 않았으면 이번 주
        nextDrawDate = thisWeekSaturday;
      }
      isToday = false;
      hasDrawPassed = false;
    }

    // 남은 시간 계산
    const timeDiff = nextDrawDate.getTime() - now.getTime();
    const daysUntilDraw = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // 정확한 일수 계산 (같은 날이면 0일)
    const exactDaysUntilDraw = timeDiff <= 0 ? 0 : 
      nextDrawDate.toDateString() === now.toDateString() ? 0 : daysUntilDraw;

    // 시간 문자열 생성
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

  // 🔄 수동 데이터 새로고침 (실시간 버전)
  const refreshData = async () => {
    try {
      console.log("🔄 실시간 데이터 강제 새로고침 시작...");
      setIsDataLoading(true);

      // 1. 강제 업데이트 실행
      const result = await lottoDataManager.forceUpdate();

      // 2. 데이터 다시 로드
      await loadRealtimeLottoData();
      loadNextDrawInfo();

      if (result.success) {
        alert("✅ 실시간 데이터가 업데이트되었습니다!\n" + result.message);
      } else {
        alert("⚠️ 일부 데이터 업데이트에 실패했습니다: " + result.message);
      }
    } catch (error) {
      console.error("❌ 실시간 데이터 새로고침 중 오류:", error);
      alert("❌ 데이터 새로고침 중 오류가 발생했습니다.");
    }
  };

  // 로또 번호 생성 로직들 (기존과 동일)
  const getMostFrequentNumbers = () => {
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

  // 내번호함 관련 함수들 (기존과 동일)
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

  // 설정 관련 함수들 (기존과 동일하지만 실시간 정보 포함)
  const exportData = () => {
    const data = {
      purchaseHistory,
      dataStatus: {
        ...dataStatus,
        // 🆕 실시간 관련 정보 추가
        crawlerVersion: "2.0.0",
        apiEndpoint: "realtime",
      },
      roundRange,
      nextDrawInfo,
      theme,
      autoSave,
      exportDate: new Date().toISOString(),
      version: "2.0.0", // 🆕 실시간 버전
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lotto_realtime_data_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (data: any) => {
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
  };

  const resetData = () => {
    setPurchaseHistory([]);
    setNextDrawInfo(null);
  };

  // 설정 Props (실시간 정보 포함)
  const settingsProps = {
    onDataExport: exportData,
    onDataImport: importData,
    onDataReset: resetData,
    onRefreshData: refreshData,
    onThemeChange: handleThemeChange,
    onAutoSaveChange: handleAutoSaveChange,
    currentTheme: theme,
    currentAutoSave: autoSave,
    dataStatus: {
      ...dataStatus,
      roundRange,
      nextDrawInfo,
      // 🆕 실시간 크롤러 상태 추가
      crawlerInfo: {
        version: "2.0.0",
        source: "en.lottolyzer.com",
        updateInterval: "10분",
        health: dataStatus.crawlerHealth,
      },
    },
  };

  // 컴포넌트 렌더링 (기존과 동일)
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
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: currentColors.text,
        transition: "all 0.3s ease",
      }}
    >
      {/* 헤더 (실시간 상태 표시 추가) */}
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
          {/* 🆕 실시간 데이터 상태 인디케이터 */}
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: dataStatus.isRealTime
                ? "#10b981" // 초록 - 실시간
                : dataStatus.source === "fallback"
                ? "#f59e0b" // 주황 - 오프라인
                : "#ef4444", // 빨강 - 오류
              animation: isDataLoading ? "pulse 2s infinite" : "none",
            }}
            title={
              dataStatus.isRealTime
                ? "실시간 연동"
                : dataStatus.source === "fallback"
                ? "오프라인 모드"
                : "연결 오류"
            }
          />
          {/* 🔧 수정된 다음 추첨 D-Day 표시 - 정확한 표시 */}
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
          {/* 자동저장 표시 */}
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

      {/* 사이드바 (수정됨: 소스 URL 제거 + 실제 데이터 범위 표시) */}
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
                <h2
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
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
                    backgroundColor:
                      currentMenu === item.id
                        ? theme === "dark"
                          ? "#334155"
                          : "#eff6ff"
                        : "transparent",
                    color:
                      currentMenu === item.id
                        ? currentColors.primary
                        : currentColors.text,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>{item.name}</span>
                </button>
              ))}

              {/* 🆕 실시간 데이터 상태 정보 (수정됨: 소스 URL 제거, 실제 데이터 반영) */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "8px",
                  backgroundColor: theme === "dark" ? "#334155" : "#f3f4f6",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    color: currentColors.textSecondary,
                    marginBottom: "4px",
                  }}
                >
                  📡 실시간 연동 상태
                </div>
                <div
                  style={{
                    color: dataStatus.isRealTime ? "#059669" : "#d97706",
                    fontWeight: "500",
                  }}
                >
                  {dataStatus.isRealTime ? "🟢 실시간 연동" : "🟡 오프라인"}
                </div>
                {dataStatus.lastUpdate && (
                  <div
                    style={{
                      color: currentColors.textSecondary,
                      marginTop: "2px",
                    }}
                  >
                    업데이트: {dataStatus.lastUpdate.toLocaleTimeString()}
                  </div>
                )}
                
                {/* 🔧 실제 회차 범위 표시 (동적으로 업데이트) */}
                <div
                  style={{
                    marginTop: "8px",
                    padding: "6px",
                    backgroundColor: theme === "dark" ? "#1e293b" : "#e0f2fe",
                    borderRadius: "4px",
                    border:
                      theme === "dark"
                        ? "1px solid #475569"
                        : "1px solid #81d4fa",
                  }}
                >
                  <div
                    style={{
                      color: theme === "dark" ? "#38bdf8" : "#0277bd",
                      fontWeight: "500",
                      fontSize: "11px",
                    }}
                  >
                    📊 {roundRange.latestRound}~{roundRange.oldestRound}회차 (
                    {pastWinningNumbers.length}개)
                  </div>
                </div>
                {/* 🔧 수정된 다음 추첨 정보 - 정확한 표시 */}
                {nextDrawInfo && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "6px",
                      backgroundColor: theme === "dark" ? "#1e293b" : "#f0fdf4",
                      borderRadius: "4px",
                      border:
                        theme === "dark"
                          ? "1px solid #475569"
                          : "1px solid #bbf7d0",
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
                    <div
                      style={{
                        color: theme === "dark" ? "#22c55e" : "#16a34a",
                        fontSize: "10px",
                      }}
                    >
                      {nextDrawInfo.isToday ? "오늘 추첨!" :
                       nextDrawInfo.daysUntilDraw === 1 ? "내일 추첨!" :
                       nextDrawInfo.daysUntilDraw === 0 ? "오늘 추첨!" :
                       `${nextDrawInfo.daysUntilDraw}일 후`}
                    </div>
                  </div>
                )}
                {/* 자동저장 상태 */}
                {autoSave && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "6px",
                      backgroundColor: theme === "dark" ? "#134e4a" : "#f0fdf4",
                      borderRadius: "4px",
                      border:
                        theme === "dark"
                          ? "1px solid #047857"
                          : "1px solid #bbf7d0",
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
            🕷️ {roundRange.latestRound}~{roundRange.oldestRound}회차 실시간
            크롤링 중...
          </div>
        )}
        {renderContent()}
      </div>

      {/* 🔧 수정된 푸터 - 정확한 추첨일 표시 */}
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
        {dataStatus.source === "realtime_crawler" && (
          <span style={{ color: currentColors.accent, marginLeft: "8px" }}>
            • {roundRange.latestRound}~{roundRange.oldestRound}회차 실시간 연동
          </span>
        )}
        {/* 🔧 수정된 다음 추첨 미니 정보 - 정확한 표시 */}
        {nextDrawInfo && (
          <div
            style={{ color: "#dc2626", marginLeft: "8px", fontWeight: "bold", textAlign: "center" }}
          >
            • 다음 추첨{" "}
            {nextDrawInfo.isToday ? "오늘!" :
             nextDrawInfo.daysUntilDraw === 1 ? "내일!" :
             nextDrawInfo.daysUntilDraw === 0 ? "오늘!" :
             `${nextDrawInfo.daysUntilDraw}일 후`}
          </div>
        )}
      </div>

      {/* 애니메이션 CSS */}
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
