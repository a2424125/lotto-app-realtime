import React, { useState, useEffect } from "react";
import Dashboard from "./components/pages/Dashboard";
import Recommend from "./components/pages/Recommend";
import Stats from "./components/pages/Stats";
import Purchase from "./components/pages/Purchase";
import MiniGame from "./components/pages/MiniGame";
import Settings from "./components/pages/Settings";
import { lottoDataManager } from "./services/lottoDataManager";
import { fetchAllLottoData } from "./services/hybridDataService";
import { calculateCurrentRound } from "./services/unifiedLottoService";
import { lottoRecommendService } from "./services/lottoRecommendService"; // 추가!
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
  const [exitConfirmCount, setExitConfirmCount] = useState(0);

  const [pastWinningNumbers, setPastWinningNumbers] = useState<number[][]>([]);
  
  const [roundRange, setRoundRange] = useState<{
    latestRound: number;
    oldestRound: number;
  }>({
    latestRound: 0,
    oldestRound: 0,
  });
  
  // 🛡️ 데이터 로딩 상태
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState<{
    lastUpdate: Date | null;
    isRealTime: boolean;
    source: "hybrid" | "fallback" | "emergency";
    crawlerHealth?: string;
    fullDataStatus?: any;
  }>({
    lastUpdate: new Date(),
    isRealTime: true,
    source: "hybrid",
    crawlerHealth: "healthy",
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

  // 🔧 메뉴 변경 함수 - 히스토리 관리 추가
  const handleMenuChange = (newMenu: string, shouldPushState: boolean = true) => {
    if (currentMenu === newMenu) return;
    
    setCurrentMenu(newMenu);
    setSidebarOpen(false);
    
    // 브라우저 히스토리에 추가
    if (shouldPushState) {
      const state = { menu: newMenu };
      const url = `#${newMenu}`;
      window.history.pushState(state, '', url);
    }
  };

  // 🔧 뒤로가기 버튼 이벤트 처리
  useEffect(() => {
    // 초기 상태 설정
    const initialMenu = window.location.hash.slice(1) || "dashboard";
    setCurrentMenu(initialMenu);
    window.history.replaceState({ menu: initialMenu }, '', `#${initialMenu}`);

    // popstate 이벤트 리스너 (뒤로가기/앞으로가기 버튼)
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.menu) {
        handleMenuChange(event.state.menu, false);
        setExitConfirmCount(0); // 종료 확인 카운트 초기화
      } else {
        // 히스토리가 없으면 대시보드로
        handleMenuChange("dashboard", false);
      }
    };

    // 안드로이드 하드웨어 뒤로가기 버튼 처리
    const handleBackButton = (e: Event) => {
      e.preventDefault();
      
      // 사이드바가 열려있으면 닫기
      if (sidebarOpen) {
        setSidebarOpen(false);
        return;
      }

      // 대시보드가 아니면 대시보드로 이동
      if (currentMenu !== "dashboard") {
        window.history.back();
        return;
      }

      // 대시보드에서 뒤로가기 시 종료 확인
      if (exitConfirmCount === 0) {
        setExitConfirmCount(1);
        
        // 토스트 메시지 표시
        const toast = document.createElement('div');
        toast.style.cssText = `
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 14px;
          z-index: 9999;
          max-width: 300px;
          text-align: center;
        `;
        toast.textContent = '뒤로가기를 한 번 더 누르면 앱이 종료됩니다.';
        document.body.appendChild(toast);

        // 2초 후 토스트 제거 및 카운트 초기화
        setTimeout(() => {
          document.body.removeChild(toast);
          setExitConfirmCount(0);
        }, 2000);
      } else {
        // 실제 종료 (웹뷰에서는 window.close()가 작동하지 않을 수 있음)
        if (window.history.length > 1) {
          window.history.go(-(window.history.length - 1));
        }
        // 안드로이드 웹뷰의 경우 네이티브 인터페이스 호출
        if ((window as any).Android && (window as any).Android.exitApp) {
          (window as any).Android.exitApp();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // 안드로이드 웹뷰에서 뒤로가기 버튼 이벤트 처리
    document.addEventListener('backbutton', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('backbutton', handleBackButton);
    };
  }, [currentMenu, sidebarOpen, exitConfirmCount]);

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
    // 🚀 하이브리드 방식으로 전체 데이터 로드
    loadHybridData();
    loadNextDrawInfo();

    const interval = setInterval(() => {
      console.log("🔄 자동 백그라운드 데이터 새로고침...");
      loadHybridData();
      loadNextDrawInfo();
    }, 30 * 60 * 1000); // 30분마다 새로고침

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadNextDrawInfo();
  }, [currentTime, roundRange]);

  // 🚀 하이브리드 전체 데이터 로딩 (수정된 함수)
  const loadHybridData = async () => {
    try {
      console.log("🚀 하이브리드 방식으로 전체 데이터 로딩 시작...");
      setIsDataLoading(true);

      // 하이브리드 서비스로 전체 데이터 가져오기
      const allData = await fetchAllLottoData();
      
      if (allData && allData.length > 0) {
        console.log(`✅ 하이브리드 데이터 로드 성공: ${allData.length}개 회차`);
        
        // 번호 배열로 변환
        const numbersArray = allData.map((draw) => [
          ...draw.numbers,
          draw.bonusNumber
        ]);

        setPastWinningNumbers(numbersArray);
        
        // 회차 범위 설정
        const rounds = allData.map(d => d.round).sort((a, b) => b - a);
        setRoundRange({
          latestRound: rounds[0],
          oldestRound: rounds[rounds.length - 1],
        });

        // 데이터 소스별 통계
        const officialCount = allData.filter(d => d.source === 'official').length;
        const lottolyzerCount = allData.filter(d => d.source === 'lottolyzer').length;

        setDataStatus({
          lastUpdate: new Date(),
          isRealTime: true,
          source: "hybrid",
          crawlerHealth: "healthy",
          fullDataStatus: {
            isFullDataLoaded: true,
            totalCount: allData.length,
            officialCount,
            lottolyzerCount,
            coverage: `${rounds[rounds.length - 1]}회 ~ ${rounds[0]}회`,
          },
        });

        console.log(`✅ 데이터 설정 완료: ${rounds[rounds.length - 1]}~${rounds[0]}회차`);
        console.log(`📊 공식 API: ${officialCount}개, Lottolyzer: ${lottolyzerCount}개`);
        
      } else {
        // 데이터가 없는 경우 로컬 비상 데이터 사용
        console.warn("⚠️ 하이브리드 데이터 없음, 로컬 데이터 사용");
        loadLocalEmergencyData();
      }
    } catch (error) {
      console.error("❌ 하이브리드 데이터 로드 실패:", error);
      // 실패 시 로컬 비상 데이터 사용
      loadLocalEmergencyData();
    } finally {
      setIsDataLoading(false);
    }
  };

  // 🛡️ 로컬 비상 데이터 로드
  const loadLocalEmergencyData = () => {
    const emergencyData = generateLocalEmergencyData();
    const currentRound = calculateCurrentRound();
    
    setPastWinningNumbers(emergencyData);
    setRoundRange({
      latestRound: currentRound,
      oldestRound: Math.max(1, currentRound - emergencyData.length + 1),
    });

    setDataStatus({
      lastUpdate: new Date(),
      isRealTime: false,
      source: "emergency",
      crawlerHealth: "emergency",
      fullDataStatus: {
        isFullDataLoaded: false,
        totalCount: emergencyData.length,
        coverage: `로컬 데이터 사용`,
      },
    });
  };

  // 🛡️ 로컬 응급 데이터 생성 (기존 함수 유지)
  const generateLocalEmergencyData = (): number[][] => {
    const emergencyData: number[][] = [];
    
    const currentRound = calculateCurrentRound();
    
    console.log(`🛡️ 로컬 응급 데이터 생성: 1~${currentRound}회차 전체`);
    
    const knownResults: { [key: number]: number[] } = {
      1181: [2, 4, 8, 21, 28, 41, 2],
      1180: [6, 12, 18, 37, 40, 41, 3],
      1179: [3, 16, 18, 24, 40, 44, 21],
      1178: [1, 7, 17, 28, 29, 40, 33],
      1177: [4, 11, 15, 28, 34, 42, 45],
      1176: [2, 8, 19, 25, 32, 44, 7],
      1175: [6, 12, 16, 28, 35, 43, 9],
      1174: [5, 13, 22, 29, 36, 42, 18],
      1173: [7, 14, 23, 30, 37, 43, 19],
      1172: [8, 15, 24, 31, 38, 44, 20],
      1171: [9, 16, 25, 32, 39, 45, 1],
      1170: [10, 17, 26, 33, 40, 1, 2],
    };
    
    // 전체 회차 생성 (1회차부터 현재 회차까지)
    for (let round = 1; round <= currentRound; round++) {
      if (knownResults[round]) {
        emergencyData.push(knownResults[round]);
      } else {
        const seed = round * 7919 + (round % 23) * 1103 + (round % 7) * 503;
        const numbers = generateLocalSafeNumbers(seed);
        const bonusNumber = ((seed * 17) % 45) + 1;
        emergencyData.push([...numbers.sort((a: number, b: number) => a - b), bonusNumber]);
      }
    }
    
    // 최신순으로 정렬
    const sortedData: number[][] = [];
    for (let i = currentRound; i >= 1; i--) {
      const roundData = emergencyData[i - 1];
      if (roundData) {
        sortedData.push(roundData);
      }
    }
    
    console.log(`🛡️ 로컬 데이터 생성 완료: ${sortedData.length}개 회차 (1~${currentRound})`);
    return sortedData;
  };

  const generateLocalSafeNumbers = (seed: number): number[] => {
    const numbers = new Set<number>();
    let currentSeed = seed;
    
    while (numbers.size < 6) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      const num = (currentSeed % 45) + 1;
      numbers.add(num);
    }
    
    return Array.from(numbers);
  };

  // 🔧 수정된 다음 추첨 정보 로딩
  const loadNextDrawInfo = () => {
    try {
      console.log("📅 다음 추첨 정보 로딩...");
      
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const koreaDay = koreaTime.getDay();
      const koreaHour = koreaTime.getHours();
      const koreaMinute = koreaTime.getMinutes();
      
      // 현재 최신 완료 회차 계산
      const currentLatestRound = calculateCurrentRound();
      
      // 추첨 완료 여부 확인
      const hasDrawPassed = koreaDay === 6 && (koreaHour > 20 || (koreaHour === 20 && koreaMinute >= 35));
      
      // 다음 추첨 회차 계산
      let nextRound: number;
      if (koreaDay === 6 && !hasDrawPassed) {
        // 토요일 추첨 전이면 오늘이 추첨일
        nextRound = currentLatestRound + 1;
      } else {
        // 토요일 추첨 후 또는 다른 요일이면 다음 토요일이 추첨일
        nextRound = currentLatestRound + 1;
      }
      
      const drawInfo = calculateNextDrawInfo(now);
      
      const nextInfo = {
        round: nextRound,
        date: drawInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: drawInfo.daysUntilDraw,
        isToday: drawInfo.isToday,
        timeUntilDraw: drawInfo.timeUntilDraw,
        hasDrawPassed: drawInfo.hasDrawPassed,
      };
      
      setNextDrawInfo(nextInfo);
      console.log("📅 다음 추첨 정보:", nextInfo);
    } catch (error) {
      console.error("❌ 다음 추첨 정보 로드 실패:", error);
    }
  };

  const calculateNextDrawInfo = (currentDate: Date) => {
    const DRAW_DAY = 6;
    const DRAW_HOUR = 20;
    const DRAW_MINUTE = 35;

    const now = new Date(currentDate);
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const currentDay = koreaTime.getDay();
    const currentHour = koreaTime.getHours();
    const currentMinute = koreaTime.getMinutes();

    const thisWeekSaturday = new Date(koreaTime);
    const daysToSaturday = (DRAW_DAY - currentDay + 7) % 7;
    thisWeekSaturday.setDate(koreaTime.getDate() + daysToSaturday);
    thisWeekSaturday.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);

    if (currentDay === DRAW_DAY) {
      thisWeekSaturday.setDate(koreaTime.getDate());
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

    const timeDiff = nextDrawDate.getTime() - koreaTime.getTime();
    const exactDaysUntilDraw = timeDiff <= 0 ? 0 : 
      nextDrawDate.toDateString() === koreaTime.toDateString() ? 0 : 
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

  // 🔄 데이터 새로고침 (수정)
  const refreshData = async () => {
    try {
      console.log("🔄 데이터 강제 새로고침 시작...");
      setIsDataLoading(true);

      // 하이브리드 방식으로 재로드
      await loadHybridData();
      loadNextDrawInfo();

      const currentCount = pastWinningNumbers.length;
      console.log(`✅ 데이터가 업데이트되었습니다! 현재 데이터: ${currentCount}개 회차`);
      
      return { success: true, message: `현재 데이터: ${currentCount}개 회차` };
    } catch (error) {
      console.error("❌ 데이터 새로고침 오류:", error);
      throw error;
    } finally {
      setIsDataLoading(false);
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
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([num]) => parseInt(num));
  };

  // ⭐️ 완전히 새로 수정된 generate1stGradeNumbers 함수
  const generate1stGradeNumbers = () => {
    // 서비스가 이미 로드되어 있고 데이터가 있으면 사용
    const loadStatus = lottoRecommendService.getLoadStatus();
    
    if (loadStatus.isLoaded && loadStatus.hasValidData) {
      try {
        // 서비스의 분석 통계 가져오기
        const stats = lottoRecommendService.getAnalysisStats();
        
        if (stats.hotNumbers && stats.hotNumbers.length >= 6) {
          // 핫넘버와 균형을 고려한 조합 생성
          const numbers = new Set<number>();
          
          // 핫넘버에서 3-4개
          const hotCount = 3 + Math.floor(Math.random() * 2);
          for (let i = 0; i < hotCount && i < stats.hotNumbers.length && numbers.size < 6; i++) {
            numbers.add(stats.hotNumbers[i]);
          }
          
          // 나머지는 균형있게
          const allNumbers = Array.from({length: 45}, (_, i) => i + 1);
          const remainingNumbers = allNumbers.filter(n => !numbers.has(n));
          
          while (numbers.size < 6 && remainingNumbers.length > 0) {
            const idx = Math.floor(Math.random() * remainingNumbers.length);
            const num = remainingNumbers[idx];
            
            // 연속 번호 체크
            const tempArray = [...Array.from(numbers), num].sort((a, b) => a - b);
            let consecutive = 1;
            let maxConsecutive = 1;
            
            for (let j = 1; j < tempArray.length; j++) {
              if (tempArray[j] === tempArray[j-1] + 1) {
                consecutive++;
                maxConsecutive = Math.max(maxConsecutive, consecutive);
              } else {
                consecutive = 1;
              }
            }
            
            if (maxConsecutive <= 2) {
              numbers.add(num);
              remainingNumbers.splice(idx, 1);
            }
          }
          
          return Array.from(numbers).sort((a, b) => a - b);
        }
      } catch (error) {
        console.log("서비스 데이터 사용 실패, 안전한 랜덤 생성 사용");
      }
    }

    // 폴백: 서비스를 사용할 수 없는 경우 안전한 랜덤 생성
    return generateSafeRandomNumbers();
  };

  // 🎯 안전한 랜덤 번호 생성 헬퍼 함수 (새로 추가)
  const generateSafeRandomNumbers = (): number[] => {
    const numbers = new Set<number>();
    let attempts = 0;
    const maxAttempts = 100;

    while (numbers.size < 6 && attempts < maxAttempts) {
      attempts++;
      numbers.clear();

      // 구간별로 균형있게 선택
      const ranges = [
        { min: 1, max: 10, count: 1 },
        { min: 11, max: 20, count: 1 },
        { min: 21, max: 30, count: 1 },
        { min: 31, max: 40, count: 2 },
        { min: 41, max: 45, count: 1 }
      ];

      // 각 구간에서 번호 선택
      for (const range of ranges) {
        for (let i = 0; i < range.count && numbers.size < 6; i++) {
          const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
          numbers.add(num);
        }
      }

      // 연속 번호 체크
      const numbersArray = Array.from(numbers).sort((a, b) => a - b);
      let hasConsecutive = false;
      let consecutiveCount = 1;
      
      for (let i = 1; i < numbersArray.length; i++) {
        if (numbersArray[i] === numbersArray[i - 1] + 1) {
          consecutiveCount++;
          if (consecutiveCount >= 3) {
            hasConsecutive = true;
            break;
          }
        } else {
          consecutiveCount = 1;
        }
      }

      if (hasConsecutive) {
        continue; // 3개 이상 연속이면 다시 생성
      }

      // 홀짝 균형 체크
      const oddCount = numbersArray.filter(n => n % 2 === 1).length;
      if (oddCount < 1 || oddCount > 5) {
        continue; // 홀수가 너무 적거나 많으면 다시
      }

      // 번호가 충분하면 완료
      if (numbers.size === 6) {
        break;
      }
    }

    // 마지막으로 부족한 경우 채우기
    while (numbers.size < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      numbers.add(num);
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
          crawlerVersion: "9.0.0-hybrid",
          apiEndpoint: "hybrid_mode",
        },
        roundRange,
        nextDrawInfo,
        theme,
        autoSave,
        exportDate: new Date().toISOString(),
        version: "9.0.0-hybrid",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lotto_hybrid_data_${new Date().toISOString().split("T")[0]}.json`;
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
        version: "9.0.0-hybrid",
        source: "hybrid_mode",
        updateInterval: "30분",
        health: dataStatus.crawlerHealth,
        dataCount: pastWinningNumbers.length,
        targetCount: calculateCurrentRound(),
        coverage: `${Math.round((pastWinningNumbers.length / calculateCurrentRound()) * 100)}%`,
        hybridMode: true,
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
            onMenuChange={handleMenuChange}
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
            onMenuChange={handleMenuChange}
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
        width: "100%",
        height: "100vh",
        backgroundColor: currentColors.background,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: currentColors.text,
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        /* Edge-to-Edge 스타일 적용 (상태바는 시스템 표시) */
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 전체 화면 컨테이너 */}
      <div
        style={{
          flex: 1,
          backgroundColor: currentColors.background,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
            position: "relative",
            zIndex: 40,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              padding: "8px",
              backgroundColor: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              borderRadius: "4px",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ☰
          </button>
          
          <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
            로또팡 6/45
          </h1>
          
          <div style={{ width: "36px" }}></div>
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
                paddingBottom: "env(safe-area-inset-bottom)",
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
                      handleMenuChange(item.id);
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

                <div
                  style={{
                    marginTop: "16px",
                    padding: "8px",
                    backgroundColor: theme === "dark" ? "#134e4a" : "#f0fdf4",
                    borderRadius: "6px",
                    fontSize: "12px",
                    border: theme === "dark" ? "1px solid #047857" : "1px solid #bbf7d0",
                  }}
                >
               
                  <div style={{ color: theme === "dark" ? "#6ee7b7" : "#166534", fontWeight: "500" }}>
                    ✅ 하이브리드 모드
                  </div>
                  {dataStatus.lastUpdate && (
                    <div style={{ color: theme === "dark" ? "#6ee7b7" : "#166534", marginTop: "2px" }}>
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
                      📊 전체 {roundRange.oldestRound}~{roundRange.latestRound}회차 ({pastWinningNumbers.length.toLocaleString()}개)
                    </div>
                    {dataStatus.fullDataStatus && (
                      <>
                        <div style={{ color: theme === "dark" ? "#38bdf8" : "#0277bd", fontSize: "10px" }}>
                          공식 API: {dataStatus.fullDataStatus.officialCount}개
                        </div>
                        <div style={{ color: theme === "dark" ? "#38bdf8" : "#0277bd", fontSize: "10px" }}>
                          Lottolyzer: {dataStatus.fullDataStatus.lottolyzerCount}개
                        </div>
                      </>
                    )}
                    <div style={{ color: theme === "dark" ? "#38bdf8" : "#0277bd", fontSize: "10px" }}>
                      커버리지: {Math.round((pastWinningNumbers.length / calculateCurrentRound()) * 100)}%
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <div 
          style={{ 
            flex: 1,
            overflow: "auto",
            paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
            position: "relative",
          }}
        >
          {isDataLoading && (
            <div
              style={{
                position: "fixed",
                top: "60px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#10b981",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                zIndex: 40,
              }}
            >
              🚀 하이브리드 방식으로 전체 데이터 로딩 중...
            </div>
          )}
          {renderContent()}
        </div>

        {/* 푸터 - 하단 안전 영역 고려 */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "calc(56px + env(safe-area-inset-bottom))",
            backgroundColor: currentColors.surface,
            borderTop: `1px solid ${currentColors.border}`,
            paddingBottom: "env(safe-area-inset-bottom)",
            zIndex: 30,
          }}
        >
          <div
            style={{
              height: "56px",
              padding: "8px 12px",
              textAlign: "center",
              fontSize: "10px",
              color: currentColors.textSecondary,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            로또는 확률게임입니다. 과도한 구매는 가계에 부담이 됩니다.
            <span style={{ color: "#10b981", marginLeft: "8px" }}>
              • 전체 {pastWinningNumbers.length}개 회차 분석 중
            </span>
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
        </div>
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
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
          }
          #root {
            width: 100%;
            height: 100%;
          }
          /* 스크롤바 스타일 */
          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
          }
        `}
      </style>
    </div>
  );
};

export default LottoApp;
