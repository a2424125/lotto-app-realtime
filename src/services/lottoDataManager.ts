// 🔄 src/services/lottoDataManager.ts
// 실시간 크롤링 기반 로또 데이터 매니저 (동적 회차 계산)

import {
  LottoDrawResult,
  LottoAPIResponse,
  LottoHistoryAPIResponse,
} from "../types/lotto";

class RealtimeLottoDataManager {
  private cachedData: LottoDrawResult[] = [];
  private isDataLoaded: boolean = false;
  private lastUpdateTime: Date | null = null;
  private apiBaseUrl: string;
  private cacheTimeout: number = 3 * 60 * 1000; // 3분 캐시
  private estimatedCurrentRound: number = 1179; // 동적으로 업데이트됨

  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl();
    this.estimatedCurrentRound = this.calculateEstimatedRound();
    console.log(`🚀 실시간 로또 데이터 매니저 초기화 (추정 회차: ${this.estimatedCurrentRound})`);
    this.initializeData();
  }

  // 🧮 현재 회차 추정 계산
  private calculateEstimatedRound(): number {
    const startDate = new Date('2002-12-07'); // 로또 시작일 (1회차)
    const currentDate = new Date();
    const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const estimated = Math.max(1179, weeksSinceStart);
    console.log(`📊 추정 현재 회차: ${estimated}회차`);
    return estimated;
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
      await this.loadCrawledData(50); // 첫 로딩은 50회차만
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

      // 🆕 실제 최신 회차로 추정값 업데이트
      if (this.cachedData.length > 0) {
        this.estimatedCurrentRound = this.cachedData[0].round;
        console.log(`📊 실제 최신 회차 확인: ${this.estimatedCurrentRound}회차`);
      }

      this.lastUpdateTime = new Date();

      console.log(`✅ 크롤링 완료: ${this.cachedData.length}회차 (${result.source})`);

      if (this.cachedData.length > 0) {
        const latest = this.cachedData[0];
        const oldest = this.cachedData[this.cachedData.length - 1];
        console.log(`📊 데이터 범위: ${latest.round}회 ~ ${oldest.round}회`);
        console.log(`🎯 최신 당첨번호: [${latest.numbers.join(', ')}] + ${latest.bonusNumber}`);
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

      // 🆕 최신 회차 업데이트
      if (result.data.round > this.estimatedCurrentRound) {
        this.estimatedCurrentRound = result.data.round;
        console.log(`📊 최신 회차 업데이트: ${this.estimatedCurrentRound}회차`);
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

  async getHistory(count: number = 100): Promise<LottoHistoryAPIResponse> {
    try {
      console.log(`📈 ${count}회차 히스토리 요청`);

      if (!this.isDataLoaded || this.isCacheExpired() || this.cachedData.length < count) {
        const loadCount = Math.max(count, 100);
        await this.loadCrawledData(loadCount);
      }

      if (this.cachedData.length === 0) {
        throw new Error("로드된 데이터가 없습니다");
      }

      const results = this.cachedData.slice(0, count);
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

      // 🔧 수정: 더 많은 fallback 데이터 생성
      const fallbackData = this.getMultipleDynamicFallbackData(count);
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
      if (!this.isDataLoaded || this.isCacheExpired()) {
        await this.loadCrawledData(10);
      }

      let latestRound = this.estimatedCurrentRound;

      if (this.cachedData.length > 0) {
        latestRound = this.cachedData[0].round;
        this.estimatedCurrentRound = latestRound; // 업데이트
      }

      const nextRound = latestRound + 1;
      const drawInfo = this.calculatePreciseNextDrawInfo();

      console.log(`📅 다음 추첨: ${nextRound}회차 (현재 최신: ${latestRound}회차)`);

      return {
        round: nextRound,
        date: drawInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: drawInfo.daysUntilDraw,
      };
    } catch (error) {
      console.error("❌ 다음 추첨 정보 오류:", error);

      const fallbackInfo = this.calculatePreciseNextDrawInfo();
      return {
        round: this.estimatedCurrentRound + 1,
        date: fallbackInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: fallbackInfo.daysUntilDraw,
      };
    }
  }

  private calculatePreciseNextDrawInfo(): {
    nextDrawDate: Date;
    daysUntilDraw: number;
    isToday: boolean;
    hasDrawPassed: boolean;
  } {
    const DRAW_DAY = 6; // 토요일
    const DRAW_HOUR = 20; // 오후 8시
    const DRAW_MINUTE = 35; // 35분

    const now = new Date();
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

    return {
      nextDrawDate,
      daysUntilDraw: exactDaysUntilDraw,
      isToday,
      hasDrawPassed,
    };
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
      return {
        latestRound: this.estimatedCurrentRound,
        oldestRound: this.estimatedCurrentRound,
        totalCount: 1,
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
        estimatedCurrentRound: this.estimatedCurrentRound,
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

  // 🔧 수정: 동적 폴백 데이터 (추정 회차 기반)
  private getDynamicFallbackData(): LottoDrawResult {
    const round = this.estimatedCurrentRound;
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

  // 🔧 수정: 여러 회차 동적 폴백 데이터 생성
  private getMultipleDynamicFallbackData(count: number = 50): LottoDrawResult[] {
    const results: LottoDrawResult[] = [];
    const currentRound = this.estimatedCurrentRound;

    // 🔧 수정: 요청된 수만큼 생성 (최소 50개)
    const generateCount = Math.max(count, 50);

    for (let i = 0; i < generateCount; i++) {
      const round = currentRound - i;
      const seed = round * 7919;
      const numbers = this.generateConsistentNumbers(seed, 6);
      const bonusNumber = (seed % 45) + 1;

      const date = new Date();
      date.setDate(date.getDate() - (i * 7));

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

    console.log(`📊 ${generateCount}개 폴백 데이터 생성: ${currentRound}~${currentRound - generateCount + 1}회차`);
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

export const lottoDataManager = new RealtimeLottoDataManager();
export default RealtimeLottoDataManager;
