// 🔄 src/services/lottoDataManager.ts
// 실시간 크롤링 기반 로또 데이터 매니저 (기존 인터페이스 100% 호환)

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
  private cacheTimeout: number = 5 * 60 * 1000; // 5분 캐시

  constructor() {
    // 🌍 환경에 따른 API URL 설정
    this.apiBaseUrl = this.getApiBaseUrl();
    console.log("🚀 실시간 로또 데이터 매니저 초기화:", this.apiBaseUrl);

    this.initializeData();
  }

  // 🌍 환경별 API URL 결정
  private getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
      // 브라우저 환경
      if (window.location.hostname === "localhost") {
        return "http://localhost:3000/api"; // 로컬 개발
      } else {
        return "/api"; // 프로덕션 (Vercel)
      }
    }
    return "/api"; // 기본값
  }

  // 📡 초기 데이터 로드 - 최대 데이터로 변경
  private async initializeData(): Promise<void> {
    try {
      console.log("📡 실시간 데이터 초기화 중...");
      await this.loadCrawledData(1200); // 300 → 1200 (1회차부터 최대한)
      this.isDataLoaded = true;
      console.log("✅ 실시간 데이터 초기화 완료");
    } catch (error) {
      console.error("❌ 초기화 실패:", error);
      this.isDataLoaded = false;
    }
  }

  // 🕷️ 크롤링 데이터 로드
  private async loadCrawledData(rounds: number = 1200): Promise<void> {
    try {
      console.log(`🔄 크롤링 API 호출: ${rounds}회차`);

      // ✅ AbortController로 타임아웃 구현
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초

      const response = await fetch(
        `${this.apiBaseUrl}/lotto-crawler?rounds=${rounds}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal, // ✅ controller.signal 사용
        }
      );

      clearTimeout(timeoutId); // 타임아웃 클리어

      if (!response.ok) {
        throw new Error(
          `크롤링 API 오류: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "크롤링 데이터 없음");
      }

      // 데이터 유효성 검사 및 정렬
      this.cachedData = result.data
        .filter((item: any) => this.isValidLottoResult(item))
        .sort((a: LottoDrawResult, b: LottoDrawResult) => b.round - a.round);

      this.lastUpdateTime = new Date();

      console.log(
        `✅ 크롤링 완료: ${this.cachedData.length}회차 (${result.source})`
      );

      if (this.cachedData.length > 0) {
        const latest = this.cachedData[0];
        const oldest = this.cachedData[this.cachedData.length - 1];
        console.log(`📊 데이터 범위: ${latest.round}회 ~ ${oldest.round}회`);
      }
    } catch (error) {
      console.error("❌ 크롤링 실패:", error);
      throw error;
    }
  }

  // ✅ 로또 결과 유효성 검사
  private isValidLottoResult(result: any): boolean {
    return (
      result &&
      typeof result.round === "number" &&
      result.round > 0 &&
      typeof result.date === "string" &&
      Array.isArray(result.numbers) &&
      result.numbers.length === 6 &&
      result.numbers.every(
        (n: any) => typeof n === "number" && n >= 1 && n <= 45
      ) &&
      typeof result.bonusNumber === "number" &&
      result.bonusNumber >= 1 &&
      result.bonusNumber <= 45
    );
  }

  // 🕐 캐시 만료 확인
  private isCacheExpired(): boolean {
    if (!this.lastUpdateTime) return true;
    return Date.now() - this.lastUpdateTime.getTime() > this.cacheTimeout;
  }

  // 📄 최신 결과 조회 (기존 인터페이스 호환)
  async getLatestResult(): Promise<LottoAPIResponse> {
    try {
      // 캐시가 유효하고 데이터가 있으면 캐시 사용
      if (!this.isCacheExpired() && this.cachedData.length > 0) {
        console.log("💾 캐시된 최신 결과 반환");
        return {
          success: true,
          data: this.cachedData[0],
          message: `${this.cachedData[0].round}회차 당첨번호 (캐시됨)`,
        };
      }

      // 🎯 최신 결과 API 호출 (빠른 응답)
      console.log("📡 최신 결과 API 호출...");

      // ✅ AbortController로 타임아웃 구현
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초

      const response = await fetch(`${this.apiBaseUrl}/latest-result`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal, // ✅ controller.signal 사용
      });

      clearTimeout(timeoutId); // 타임아웃 클리어

      if (!response.ok) {
        throw new Error(`최신 결과 API 오류: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "최신 결과 없음");
      }

      console.log(`✅ 최신 결과: ${result.data.round}회차`);

      return {
        success: true,
        data: result.data,
        message: `${result.data.round}회차 당첨번호`,
      };
    } catch (error) {
      console.error("❌ 최신 결과 조회 실패:", error);

      // 🔄 폴백: 캐시된 데이터 사용
      if (this.cachedData.length > 0) {
        console.log("🔄 폴백: 캐시된 데이터 사용");
        return {
          success: true,
          data: this.cachedData[0],
          message: `${this.cachedData[0].round}회차 당첨번호 (오프라인)`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
        data: this.getFallbackData(),
      };
    }
  }

  // 📊 회차별 결과 조회 (기존 인터페이스 호환)
  async getResultByRound(round: number): Promise<LottoAPIResponse> {
    try {
      // 데이터 로드 확인
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

  // 📈 히스토리 조회 (기존 인터페이스 호환) - 기본값 증가
  async getHistory(count: number = 1200): Promise<LottoHistoryAPIResponse> {
    try {
      console.log(`📈 ${count}회차 히스토리 요청`);

      // 캐시 확인 및 갱신
      if (
        !this.isDataLoaded ||
        this.isCacheExpired() ||
        this.cachedData.length < count
      ) {
        // 요청된 회차 수보다 많은 데이터 로드 (최대한)
        const loadCount = Math.max(count, 1200); // 200 → 1200
        await this.loadCrawledData(loadCount);
      }

      if (this.cachedData.length === 0) {
        throw new Error("로드된 데이터가 없습니다");
      }

      const results = this.cachedData.slice(0, count);
      const latest = results[0];
      const oldest = results[results.length - 1];

      console.log(
        `✅ 히스토리 반환: ${results.length}회차 (${latest.round}~${oldest.round}회차)`
      );

      return {
        success: true,
        data: results,
        message: `${results.length}회차 데이터 (${latest.round}~${oldest.round}회차)`,
      };
    } catch (error) {
      console.error("❌ 히스토리 조회 실패:", error);

      // 폴백 데이터 반환
      return {
        success: false,
        data: [this.getFallbackData()],
        error: error instanceof Error ? error.message : "히스토리 조회 실패",
      };
    }
  }

  // 📅 🔧 완전히 수정된 다음 추첨 정보 - 정확한 시간 계산
  async getNextDrawInfo(): Promise<{
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
  }> {
    try {
      // 최신 데이터 확인
      if (!this.isDataLoaded || this.isCacheExpired()) {
        await this.loadCrawledData(1); // 최신 1회차만
      }

      let latestRound = 1178; // 기본값

      if (this.cachedData.length > 0) {
        latestRound = this.cachedData[0].round;
      }

      const nextRound = latestRound + 1;
      const drawInfo = this.calculatePreciseNextDrawInfo();

      console.log(
        `📅 다음 추첨: ${nextRound}회차 (현재 최신: ${latestRound}회차)`
      );

      return {
        round: nextRound,
        date: drawInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: drawInfo.daysUntilDraw,
      };
    } catch (error) {
      console.error("❌ 다음 추첨 정보 오류:", error);

      // 폴백 정보
      const fallbackInfo = this.calculatePreciseNextDrawInfo();
      return {
        round: 1179,
        date: fallbackInfo.nextDrawDate.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: fallbackInfo.daysUntilDraw,
      };
    }
  }

  // 🔧 완전히 새로운 정확한 추첨일 계산 함수
  private calculatePreciseNextDrawInfo(): {
    nextDrawDate: Date;
    daysUntilDraw: number;
    isToday: boolean;
    hasDrawPassed: boolean;
  } {
    // 로또 추첨: 매주 토요일 오후 8시 35분
    const DRAW_DAY = 6; // 토요일 (0: 일요일, 6: 토요일)
    const DRAW_HOUR = 20; // 오후 8시
    const DRAW_MINUTE = 35; // 35분

    const now = new Date();
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

    return {
      nextDrawDate,
      daysUntilDraw: exactDaysUntilDraw,
      isToday,
      hasDrawPassed,
    };
  }

  // 🔄 강제 업데이트 (기존 인터페이스 호환) - 최대 데이터로 변경
  async forceUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔄 강제 업데이트 시작...");

      // 캐시 무효화
      this.lastUpdateTime = null;
      this.cachedData = [];

      // 새 데이터 로드 - 최대한 많이
      await this.loadCrawledData(1200); // 300 → 1200

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

  // 📊 데이터 범위 정보 (기존 인터페이스 호환)
  getDataRange(): {
    latestRound: number;
    oldestRound: number;
    totalCount: number;
  } {
    if (this.cachedData.length === 0) {
      return {
        latestRound: 1178,
        oldestRound: 1178,
        totalCount: 1,
      };
    }

    return {
      latestRound: this.cachedData[0].round,
      oldestRound: this.cachedData[this.cachedData.length - 1].round,
      totalCount: this.cachedData.length,
    };
  }

  // 🔍 서비스 상태 (기존 인터페이스 호환)
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
      },
      nextUpdateIn:
        this.cacheTimeout -
        (Date.now() - (this.lastUpdateTime?.getTime() || 0)),
    };
  }

  // 🗑️ 정리 함수
  cleanup(): void {
    this.cachedData = [];
    this.isDataLoaded = false;
    this.lastUpdateTime = null;
    console.log("🧹 실시간 데이터 매니저 정리 완료");
  }

  // 🔄 폴백 데이터 (기존과 동일)
  private getFallbackData(): LottoDrawResult {
    return {
      round: 1178,
      date: "2025-06-28",
      numbers: [5, 6, 11, 27, 43, 44],
      bonusNumber: 17,
      jackpotWinners: 12,
      jackpotPrize: 2391608407,
    };
  }

  // 🎯 헬스체크 API 호출
  async checkHealth(): Promise<any> {
    try {
      // ✅ AbortController로 타임아웃 구현
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

// 🚀 싱글톤 인스턴스 (기존과 동일한 export 이름)
export const lottoDataManager = new RealtimeLottoDataManager();
export default RealtimeLottoDataManager;
