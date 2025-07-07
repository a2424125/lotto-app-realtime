// 🔄 src/services/lottoDataManager.ts
// 🔧 수정: 정확한 회차 계산 및 추첨일 로직 개선 (2025년 7월 5일 1179회차 기준)

import {
  LottoDrawResult,
  LottoAPIResponse,
  LottoHistoryAPIResponse,
} from "../types/lotto";

// Public interface to expose only required methods
export interface IRealtimeLottoDataManager {
  forceUpdate(): Promise<{ success: boolean; message: string }>;
  getHistory(count?: number): Promise<LottoHistoryAPIResponse>;
}

class RealtimeLottoDataManager implements IRealtimeLottoDataManager {
  private cachedData: LottoDrawResult[] = [];
  private isDataLoaded: boolean = false;
  private lastUpdateTime: Date | null = null;
  private apiBaseUrl: string;
  private cacheTimeout: number = 3 * 60 * 1000; // 3분 캐시

  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl();
    console.log(`🚀 실시간 로또 데이터 매니저 초기화`);
    this.initializeData();
  }

  // 🔧 수정된 정확한 현재 회차 계산 (2025년 7월 5일 1179회차 기준)
  private calculateCurrentRound(): number {
    // 🎯 기준점: 2025년 7월 5일(토) = 1179회차 추첨일
    const referenceDate = new Date('2025-07-05'); // 2025년 7월 5일 토요일
    const referenceRound = 1179;
    
    const now = new Date();
    
    // 기준일로부터 경과된 주 수 계산
    const timeDiff = now.getTime() - referenceDate.getTime();
    const weeksPassed = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
    
    const currentRound = referenceRound + weeksPassed;
    
    console.log(`📊 정확한 현재 회차: ${currentRound}회차 (기준: 2025.7.5 = 1179회차)`);
    return currentRound;
  }

  // 🔧 수정된 다음 추첨 회차 및 날짜 계산
  private calculateNextDrawInfo(): {
    nextRound: number;
    nextDrawDate: Date;
    daysUntilDraw: number;
    isToday: boolean;
    hasDrawPassed: boolean;
    timeUntilDraw: string;
  } {
    const DRAW_DAY = 6; // 토요일 (0: 일요일, 6: 토요일)
    const DRAW_HOUR = 20; // 오후 8시
    const DRAW_MINUTE = 35; // 35분

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 현재 회차 계산
    const currentRound = this.calculateCurrentRound();

    // 🎯 다음 추첨일 계산
    let nextDrawDate = new Date(now);
    let nextRound: number;
    
    if (currentDay === DRAW_DAY) {
      // 오늘이 토요일인 경우
      if (currentHour < DRAW_HOUR || (currentHour === DRAW_HOUR && currentMinute < DRAW_MINUTE)) {
        // 🕐 아직 추첨시간 전 → 오늘이 현재 회차 추첨일
        nextDrawDate.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
        nextRound = currentRound;
      } else {
        // 🕐 추첨시간 지남 → 다음 주 토요일이 다음 회차
        nextDrawDate.setDate(now.getDate() + 7);
        nextDrawDate.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
        nextRound = currentRound + 1;
      }
    } else {
      // 오늘이 토요일이 아닌 경우 → 다음 토요일이 현재 회차 추첨일
      const daysUntilSaturday = (DRAW_DAY - currentDay + 7) % 7;
      if (daysUntilSaturday === 0) {
        // 일요일인 경우 다음 토요일은 6일 후
        nextDrawDate.setDate(now.getDate() + 6);
      } else {
        nextDrawDate.setDate(now.getDate() + daysUntilSaturday);
      }
      nextDrawDate.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
      nextRound = currentRound;
    }

    // 시간 계산
    const timeDiff = nextDrawDate.getTime() - now.getTime();
    const exactDaysUntilDraw = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const isToday = nextDrawDate.toDateString() === now.toDateString();
    const hasDrawPassed = currentDay === DRAW_DAY && currentHour >= DRAW_HOUR && currentMinute >= DRAW_MINUTE;

    // 시간 표시 메시지
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
    } else {
      timeUntilDraw = `${exactDaysUntilDraw}일 후 추첨`;
    }

    console.log(`📅 다음 추첨: ${nextRound}회차 (${nextDrawDate.toLocaleDateString()}) - ${timeUntilDraw}`);

    return {
      nextRound,
      nextDrawDate,
      daysUntilDraw: exactDaysUntilDraw,
      isToday,
      hasDrawPassed,
      timeUntilDraw,
    };
  }

  private getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        return "http://localhost:3000/api";
      } else {
        return "/api";
      }
    }
    return "/api";
  }

  private async initializeData(): Promise<void> {
    try {
      console.log("📡 실시간 데이터 초기화 중...");
      await this.loadCrawledData(1200); // 전체 데이터 로드
      this.isDataLoaded = true;
      console.log("✅ 실시간 데이터 초기화 완료");
    } catch (error) {
      console.error("❌ 초기화 실패:", error);
      this.isDataLoaded = false;
    }
  }

  private async loadCrawledData(rounds: number = 100): Promise<void> {
    try {
      console.log(`🔄 크롤링 API 호출: ${rounds}회차`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(
        `${this.apiBaseUrl}/lotto-crawler?rounds=${rounds}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`크롤링 API 오류: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "크롤링 데이터 없음");
      }

      this.cachedData = result.data
        .filter((item: any) => this.isValidLottoResult(item))
        .sort((a: LottoDrawResult, b: LottoDrawResult) => b.round - a.round);

      this.lastUpdateTime = new Date();

      console.log(`✅ 크롤링 완료: ${this.cachedData.length}회차 (${result.source})`);

      if (this.cachedData.length > 0) {
        const latest = this.cachedData[0];
        const oldest = this.cachedData[this.cachedData.length - 1];
        console.log(`📊 데이터 범위: ${latest.round}회 ~ ${oldest.round}회`);
        console.log(`🎯 최신 당첨번호: [${latest.numbers.join(', ')}] + ${latest.bonusNumber}`);
        
        // 🔧 1179회차 검증
        const round1179 = this.cachedData.find(data => data.round === 1179);
        if (round1179) {
          console.log(`✅ 1179회차 확인: [${round1179.numbers.join(', ')}] + ${round1179.bonusNumber}`);
        }
      }
    } catch (error) {
      console.error("❌ 크롤링 실패:", error);
      throw error;
    }
  }

  private isValidLottoResult(result: any): boolean {
    return (
      result &&
      typeof result.round === "number" &&
      result.round > 0 &&
      typeof result.date === "string" &&
      Array.isArray(result.numbers) &&
      result.numbers.length === 6 &&
      result.numbers.every((n: any) => typeof n === "number" && n >= 1 && n <= 45) &&
      typeof result.bonusNumber === "number" &&
      result.bonusNumber >= 1 &&
      result.bonusNumber <= 45
    );
  }

  private isCacheExpired(): boolean {
    if (!this.lastUpdateTime) return true;
    return Date.now() - this.lastUpdateTime.getTime() > this.cacheTimeout;
  }

  async getLatestResult(): Promise<LottoAPIResponse> {
    try {
      console.log("📡 최신 결과 API 호출...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.apiBaseUrl}/latest-result`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`최신 결과 API 오류: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "최신 결과 없음");
      }

      console.log(`✅ 최신 결과: ${result.data.round}회차 - ${result.source || 'unknown'}`);

      return {
        success: true,
        data: result.data,
        message: `${result.data.round}회차 당첨번호`,
      };
    } catch (error) {
      console.error("❌ 최신 결과 조회 실패:", error);

      if (this.cachedData.length > 0) {
        console.log("🔄 폴백: 캐시된 데이터 사용");
        return {
          success: true,
          data: this.cachedData[0],
          message: `${this.cachedData[0].round}회차 당첨번호 (캐시됨)`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
        data: this.getDynamicFallbackData(),
      };
    }
  }

  async getResultByRound(round: number): Promise<LottoAPIResponse> {
    try {
      if (!this.isDataLoaded || this.isCacheExpired()) {
        await this.loadCrawledData();
      }

      const result = this.cachedData.find((data) => data.round === round);

      if (result) {
        return {
          success: true,
          data: result,
          message: `${round}회차 데이터`,
        };
      } else {
        return {
          success: false,
          error: `${round}회차 데이터를 찾을 수 없습니다`,
        };
      }
    } catch (error) {
      console.error(`❌ ${round}회차 조회 실패:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "조회 실패",
      };
    }
  }

 // getHistory 메서드 수정
async getHistory(count: number = 100): Promise<LottoHistoryAPIResponse> {
  try {
    const currentRound = this.calculateCurrentRound();
    console.log(`📈 ${count}회차 히스토리 요청 (현재 회차: ${currentRound})`);

    // 🔧 수정: 200 제한 제거하고 요청된 수만큼 로드
    if (!this.isDataLoaded || this.isCacheExpired() || this.cachedData.length < count) {
      await this.loadCrawledData(count); // 제한 없이 요청된 수만큼
    }

    if (this.cachedData.length === 0) {
      throw new Error("로드된 데이터가 없습니다");
    }

    const results = this.cachedData.slice(0, Math.min(count, this.cachedData.length));
    const latest = results[0];
    const oldest = results[results.length - 1];

    console.log(`✅ 히스토리 반환: ${results.length}회차 (${latest.round}~${oldest.round}회차)`);

    return {
      success: true,
      data: results,
      message: `${results.length}회차 데이터 (${latest.round}~${oldest.round}회차)`,
    };
  } catch (error) {
    console.error("❌ 히스토리 조회 실패:", error);

    // 전체 회차 fallback 데이터 생성
    const currentRound = this.calculateCurrentRound();
    const fallbackData = this.getMultipleDynamicFallbackData(Math.min(count, currentRound));
    return {
      success: false,
      data: fallbackData,
      error: error instanceof Error ? error.message : "히스토리 조회 실패",
    };
  }
}

      // 전체 회차 fallback 데이터 생성
      const currentRound = this.calculateCurrentRound();
      const fallbackData = this.getMultipleDynamicFallbackData(Math.min(count, currentRound));
      return {
        success: false,
        data: fallbackData,
        error: error instanceof Error ? error.message : "히스토리 조회 실패",
      };
    }
  }

  async getNextDrawInfo(): Promise<{
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
  }> {
    try {
      const drawInfo = this.calculateNextDrawInfo();

      console.log(`📅 다음 추첨: ${drawInfo.nextRound}회차`);

      return {
        round: drawInfo.nextRound,
        date: drawInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: drawInfo.daysUntilDraw,
      };
    } catch (error) {
      console.error("❌ 다음 추첨 정보 오류:", error);

      const currentRound = this.calculateCurrentRound();
      const fallbackInfo = this.calculateNextDrawInfo();
      return {
        round: currentRound,
        date: fallbackInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: fallbackInfo.daysUntilDraw,
      };
    }
  }

  async forceUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔄 강제 업데이트 시작...");

      this.lastUpdateTime = null;
      this.cachedData = [];

      await this.loadCrawledData(100);

      if (this.cachedData.length > 0) {
        const latest = this.cachedData[0];
        const oldest = this.cachedData[this.cachedData.length - 1];

        return {
          success: true,
          message: `실시간 업데이트 완료: ${latest.round}~${oldest.round}회차 (${this.cachedData.length}개)`,
        };
      } else {
        throw new Error("업데이트된 데이터가 없습니다");
      }
    } catch (error) {
      console.error("❌ 강제 업데이트 실패:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "업데이트 실패",
      };
    }
  }

  getDataRange(): {
    latestRound: number;
    oldestRound: number;
    totalCount: number;
  } {
    if (this.cachedData.length === 0) {
      const currentRound = this.calculateCurrentRound();
      return {
        latestRound: currentRound - 1, // 🔧 수정: 현재 추첨된 최신 회차
        oldestRound: Math.max(1, currentRound - 50),
        totalCount: 50,
      };
    }

    return {
      latestRound: this.cachedData[0].round,
      oldestRound: this.cachedData[this.cachedData.length - 1].round,
      totalCount: this.cachedData.length,
    };
  }

  getServiceStatus() {
    const dataRange = this.getDataRange();
    const currentRound = this.calculateCurrentRound();

    return {
      lastUpdateTime: this.lastUpdateTime,
      isUpdating: false,
      crawlerStatus: {
        mode: "realtime_crawler",
        totalRounds: dataRange.totalCount,
        isDataLoaded: this.isDataLoaded,
        latestRound: dataRange.latestRound,
        oldestRound: dataRange.oldestRound,
        dataRange: `${dataRange.latestRound}~${dataRange.oldestRound}회차`,
        lastCrawl: this.lastUpdateTime?.toISOString() || null,
        source: "en.lottolyzer.com",
        currentRound: currentRound,
      },
      nextUpdateIn: this.cacheTimeout - (Date.now() - (this.lastUpdateTime?.getTime() || 0)),
    };
  }

  cleanup(): void {
    this.cachedData = [];
    this.isDataLoaded = false;
    this.lastUpdateTime = null;
    console.log("🧹 실시간 데이터 매니저 정리 완료");
  }

  // 정확한 회차 기반 폴백 데이터
  private getDynamicFallbackData(): LottoDrawResult {
    const round = this.calculateCurrentRound() - 1; // 최신 추첨된 회차
    const seed = round * 7919;
    const numbers = this.generateConsistentNumbers(seed, 6);
    const bonusNumber = (seed % 45) + 1;

    return {
      round,
      date: new Date().toISOString().split('T')[0],
      numbers: numbers.sort((a, b) => a - b),
      bonusNumber,
      jackpotWinners: Math.floor((seed % 15)) + 1,
      jackpotPrize: Math.floor((seed % 2000000000)) + 1000000000,
      crawledAt: new Date().toISOString(),
      source: "dynamic_fallback",
    };
  }

  // 전체 회차 폴백 데이터 생성 (1회차부터)
  private getMultipleDynamicFallbackData(count: number): LottoDrawResult[] {
    const results: LottoDrawResult[] = [];
    const currentRound = this.calculateCurrentRound() - 1; // 최신 추첨된 회차
    const maxCount = Math.min(count, currentRound);

    console.log(`📊 ${maxCount}개 폴백 데이터 생성: 1~${currentRound}회차`);

    for (let round = currentRound; round >= Math.max(1, currentRound - maxCount + 1); round--) {
      const seed = round * 7919;
      const numbers = this.generateConsistentNumbers(seed, 6);
      const bonusNumber = (seed % 45) + 1;

      const startDate = new Date('2002-12-07'); // 1회차 날짜
      const date = new Date(startDate);
      date.setDate(date.getDate() + (round - 1) * 7); // 회차별 날짜 계산

      results.push({
        round,
        date: date.toISOString().split('T')[0],
        numbers: numbers.sort((a, b) => a - b),
        bonusNumber,
        jackpotWinners: Math.floor((seed % 15)) + 1,
        jackpotPrize: Math.floor((seed % 2000000000)) + 1000000000,
        crawledAt: new Date().toISOString(),
        source: "dynamic_fallback",
      });
    }

    return results;
  }

  private generateConsistentNumbers(seed: number, count: number): number[] {
    const numbers = new Set<number>();
    let currentSeed = seed;

    while (numbers.size < count) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      const num = (currentSeed % 45) + 1;
      numbers.add(num);
    }

    return Array.from(numbers);
  }

  async checkHealth(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.apiBaseUrl}/health-check`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`헬스체크 실패: ${response.status}`);
      }

      const health = await response.json();
      console.log("💚 서비스 상태:", health.status);
      return health;
    } catch (error) {
      console.error("❌ 헬스체크 오류:", error);
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "상태 확인 실패",
      };
    }
  }
}

export const lottoDataManager: IRealtimeLottoDataManager = new RealtimeLottoDataManager();
export default RealtimeLottoDataManager;
