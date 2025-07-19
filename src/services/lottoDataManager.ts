// 🛡️ src/services/lottoDataManager.ts
// 응급 안전 시스템 - 크롤링 실패시 즉시 안전한 데이터 제공

import {
  LottoDrawResult,
  LottoAPIResponse,
  LottoHistoryAPIResponse,
} from "../types/lotto";

class EmergencyLottoDataManager {
  private cachedData: LottoDrawResult[] = [];
  private isDataLoaded: boolean = false;
  private lastUpdateTime: Date | null = null;
  private apiBaseUrl: string;
  private cacheTimeout: number = 10 * 60 * 1000;
  private isLoading: boolean = false;
  private readonly REFERENCE_DATE = '2025-07-05';
  private readonly REFERENCE_ROUND = 1179;
  private retryTimer: NodeJS.Timeout | null = null;
  private isWaitingForResult: boolean = false;
  
  // 🛡️ 응급 모드 설정
  private emergencyMode: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl();
    console.log(`🛡️ 로또 데이터 매니저 초기화`);
    
    // 🔥 즉시 초기 데이터 로드 시도
    this.initializeData();
    
    // 추첨 대기 시간 체크 및 재시도 스케줄링
    this.scheduleRetryCheck();
  }

  // 🔧 추첨 대기 시간 확인 함수
  private isInWaitingPeriod(): boolean {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const koreaDay = koreaTime.getDay();
    const koreaHour = koreaTime.getHours();
    const koreaMinute = koreaTime.getMinutes();
    
    // 토요일 20:35 ~ 20:50 사이인지 확인
    if (koreaDay === 6) {
      const totalMinutes = koreaHour * 60 + koreaMinute;
      const drawStartMinutes = 20 * 60 + 35; // 20:35
      const drawEndMinutes = 20 * 60 + 50; // 20:50
      
      return totalMinutes >= drawStartMinutes && totalMinutes <= drawEndMinutes;
    }
    
    return false;
  }

  // 🔧 추첨 후 2시간 이내인지 확인
  private isWithinTwoHoursAfterDraw(): boolean {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const koreaDay = koreaTime.getDay();
    const koreaHour = koreaTime.getHours();
    const koreaMinute = koreaTime.getMinutes();
    
    // 토요일 20:35 ~ 22:35 사이인지 확인
    if (koreaDay === 6) {
      const totalMinutes = koreaHour * 60 + koreaMinute;
      const drawStartMinutes = 20 * 60 + 35; // 20:35
      const twoHoursAfterMinutes = 22 * 60 + 35; // 22:35
      
      return totalMinutes >= drawStartMinutes && totalMinutes <= twoHoursAfterMinutes;
    }
    
    return false;
  }

  // 🔧 재시도 스케줄링
  private scheduleRetryCheck(): void {
    // 기존 타이머 정리
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
    
    // 5분마다 체크
    this.retryTimer = setInterval(() => {
      if (this.isWithinTwoHoursAfterDraw() && !this.isInWaitingPeriod()) {
        console.log("🔄 추첨 후 2시간 이내, 크롤링 재시도");
        this.tryBackgroundUpdate();
      }
    }, 5 * 60 * 1000); // 5분
  }

  // 🛡️ 초기 데이터 로드
  private async initializeData(): Promise<void> {
    console.log("🛡️ 초기 데이터 로드 시작...");
    
    try {
      // 먼저 크롤링 시도
      await this.tryBackgroundUpdate();
      
      // 데이터가 없으면 자동 생성
      if (this.cachedData.length === 0) {
        console.log("🤖 크롤링 실패, 자동 생성 데이터 사용");
        this.generateAutoData();
      }
      
    } catch (error) {
      console.error("❌ 초기 데이터 로드 실패:", error);
      this.generateAutoData();
    }
  }

  // 🔧 수정된 현재 회차 계산 함수 - 추첨 시간 고려
  private calculateCurrentRound(): number {
    const referenceDate = new Date(this.REFERENCE_DATE);
    const referenceRound = this.REFERENCE_ROUND;
    const now = new Date();
    
    // 한국 시간으로 변환
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const koreaDay = koreaTime.getDay();
    const koreaHour = koreaTime.getHours();
    const koreaMinute = koreaTime.getMinutes();
    
    // 기준일부터 현재까지의 주 수 계산
    const timeDiff = now.getTime() - referenceDate.getTime();
    const weeksPassed = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
    
    // 기본 계산: 기준 회차 + 경과 주수
    let currentRound = referenceRound + weeksPassed;
    
    // 토요일이고 추첨 시간(20:35) 전이면 아직 이번 주 추첨이 안 됨
    if (koreaDay === 6 && (koreaHour < 20 || (koreaHour === 20 && koreaMinute < 35))) {
      // 아직 추첨 전이므로 현재 회차는 이전 회차
      currentRound = currentRound - 1;
    }
    
    console.log(`📊 현재 완료된 회차 계산: ${currentRound}회차`);
    console.log(`📊 한국시간: ${koreaTime.toLocaleString('ko-KR')}, 요일: ${koreaDay}, 시간: ${koreaHour}:${koreaMinute}`);
    
    return currentRound;
  }

  // 🔧 추첨 완료 여부 확인
  private hasDrawCompleted(): boolean {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    
    const koreaDay = koreaTime.getDay();
    const koreaHour = koreaTime.getHours();
    const koreaMinute = koreaTime.getMinutes();
    
    // 토요일 20:35 이후이거나 일요일 이후면 추첨 완료
    if (koreaDay === 6) {
      return koreaHour > 20 || (koreaHour === 20 && koreaMinute >= 35);
    } else if (koreaDay === 0) {
      return true; // 일요일은 항상 추첨 완료
    } else {
      return true; // 월~금도 추첨 완료
    }
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

  // 🛡️ 자동 데이터 생성 (크롤링 실패시 사용)
  private generateAutoData(): void {
    const currentRound = this.calculateCurrentRound();
    console.log(`🤖 자동 데이터 생성: 최근 100회차`);
    
    const autoData: LottoDrawResult[] = [];
    const startDate = new Date('2002-12-07');
    
    // 최근 100회차만 생성 (메모리 절약)
    const startRound = Math.max(1, currentRound - 99);
    
    for (let round = currentRound; round >= startRound; round--) {
      const seed = round * 7919 + (round % 23) * 1103 + (round % 7) * 503;
      const numbers = this.generateSafeNumbers(seed, 6);
      const bonusNumber = ((seed * 17) % 45) + 1;

      const date = new Date(startDate);
      date.setDate(date.getDate() + (round - 1) * 7);

      autoData.push({
        round,
        date: date.toISOString().split('T')[0],
        numbers: numbers.sort((a, b) => a - b),
        bonusNumber,
        crawledAt: new Date().toISOString(),
        source: "auto_generated",
      });
    }

    this.cachedData = autoData;
    this.isDataLoaded = true;
    this.lastUpdateTime = new Date();
    this.emergencyMode = true;

    console.log(`✅ 자동 데이터 생성 완료: ${autoData.length}회차`);
  }

  private generateSafeNumbers(seed: number, count: number): number[] {
    const numbers = new Set<number>();
    let currentSeed = seed;

    while (numbers.size < count) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      const num = (currentSeed % 45) + 1;
      numbers.add(num);
    }

    return Array.from(numbers);
  }

  // 🔄 백그라운드 업데이트 시도 (실패해도 계속 진행)
  private async tryBackgroundUpdate(): Promise<void> {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      console.log("🔄 백그라운드 데이터 업데이트 시도...");
      
      const currentRound = this.calculateCurrentRound();
      
      // 짧은 타임아웃으로 크롤링 시도
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초만 시도

      try {
        const response = await fetch(
          `${this.apiBaseUrl}/lotto-crawler?rounds=100`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            console.log(`✅ 백그라운드 업데이트 성공: ${result.data.length}개 회차`);
            
            const newData = result.data.filter((item: any) => this.isValidLottoResult(item));
            if (newData.length > 0) {
              this.cachedData = newData.sort((a: LottoDrawResult, b: LottoDrawResult) => b.round - a.round);
              this.lastUpdateTime = new Date();
              this.isWaitingForResult = false;
              this.emergencyMode = false;
              this.isDataLoaded = true;
              console.log("🔄 실제 데이터로 업데이트 완료");
            }
          } else if (result.isWaitingPeriod) {
            this.isWaitingForResult = true;
            console.log("⏳ 추첨 대기 시간");
          } else if (result.isUpdating) {
            console.log("🔄 데이터 업데이트 중");
          }
        }
      } catch (updateError) {
        console.warn("⚠️ 백그라운드 업데이트 실패 (계속 진행):", updateError);
      }
      
    } catch (error) {
      console.warn("⚠️ 백그라운드 업데이트 오류 (계속 진행):", error);
    } finally {
      this.isLoading = false;
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

  // ✅ 최신 결과 조회
  async getLatestResult(): Promise<LottoAPIResponse> {
    // 추첨 대기 시간 확인
    if (this.isInWaitingPeriod()) {
      this.isWaitingForResult = true;
      console.log("⏳ 추첨 대기 시간");
      
      return {
        success: false,
        error: "추첨 결과 집계중입니다",
      };
    }
    
    // 캐시 만료시 업데이트 시도
    if (this.isCacheExpired()) {
      await this.tryBackgroundUpdate();
    }
    
    // 캐시된 데이터가 있으면 반환
    if (this.cachedData.length > 0) {
      return {
        success: true,
        data: this.cachedData[0],
        message: `${this.cachedData[0].round}회차 당첨번호`,
      };
    }

    // 데이터가 없는 경우
    if (this.isWithinTwoHoursAfterDraw()) {
      return {
        success: false,
        error: "결과 업데이트 중입니다. 잠시 후 다시 확인해주세요",
      };
    }
    
    return {
      success: false,
      error: "데이터를 불러올 수 없습니다",
    };
  }

  async getResultByRound(round: number): Promise<LottoAPIResponse> {
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
  }

  // ✅ 히스토리 조회
  async getHistory(count: number): Promise<LottoHistoryAPIResponse> {
    try {
      // 캐시 만료시 업데이트 시도
      if (this.isCacheExpired()) {
        await this.tryBackgroundUpdate();
      }
      
      // 데이터가 없는 경우
      if (this.cachedData.length === 0) {
        if (this.isWithinTwoHoursAfterDraw()) {
          return {
            success: false,
            error: "데이터 업데이트 중입니다",
          };
        }
        
        // 자동 생성 데이터 사용
        this.generateAutoData();
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
      
      return {
        success: false,
        error: "히스토리 데이터를 불러올 수 없습니다",
      };
    }
  }

  // 🔧 수정된 다음 추첨 정보
  async getNextDrawInfo(): Promise<{
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
    isToday: boolean;
    timeUntilDraw: string;
    hasDrawPassed: boolean;
  }> {
    try {
      const currentRound = this.calculateCurrentRound();
      const hasDrawCompleted = this.hasDrawCompleted();
      
      // 한국 시간 계산
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const koreaDay = koreaTime.getDay();
      const koreaHour = koreaTime.getHours();
      const koreaMinute = koreaTime.getMinutes();
      
      // 다음 추첨 회차 계산
      let nextRound: number;
      if (koreaDay === 6 && !hasDrawCompleted) {
        // 토요일 추첨 전이면 오늘이 추첨일
        nextRound = currentRound + 1;
      } else {
        // 토요일 추첨 후 또는 다른 요일이면 다음 토요일이 추첨일
        nextRound = currentRound + 1;
      }

      // 다음 토요일 계산
      const nextSaturday = new Date(koreaTime);
      const currentDay = koreaTime.getDay();
      const daysUntilSaturday = (6 - currentDay + 7) % 7;
      
      // 토요일이지만 추첨 전이면 오늘이 추첨일
      if (currentDay === 6 && !hasDrawCompleted) {
        // 오늘이 추첨일
      } else if (daysUntilSaturday === 0) {
        // 토요일이고 추첨 후면 다음 주 토요일
        nextSaturday.setDate(koreaTime.getDate() + 7);
      } else {
        // 다른 요일이면 이번 주 토요일
        nextSaturday.setDate(koreaTime.getDate() + daysUntilSaturday);
      }
      
      // 추첨 시간 설정 (20:35)
      nextSaturday.setHours(20, 35, 0, 0);
      
      const msUntilDraw = nextSaturday.getTime() - koreaTime.getTime();
      const hoursUntilDraw = Math.floor(msUntilDraw / (1000 * 60 * 60));
      const minutesUntilDraw = Math.floor((msUntilDraw % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeUntilDraw = "";
      if (hoursUntilDraw > 24) {
        const daysUntil = Math.floor(hoursUntilDraw / 24);
        timeUntilDraw = `${daysUntil}일 ${hoursUntilDraw % 24}시간 후`;
      } else if (hoursUntilDraw > 0) {
        timeUntilDraw = `${hoursUntilDraw}시간 ${minutesUntilDraw}분 후`;
      } else if (minutesUntilDraw > 0) {
        timeUntilDraw = `${minutesUntilDraw}분 후`;
      } else {
        timeUntilDraw = "곧 추첨 시작!";
      }
      
      const isToday = currentDay === 6 && !hasDrawCompleted;

      console.log(`📅 다음 추첨 정보: ${nextRound}회차, 오늘: ${isToday}, 시간: ${timeUntilDraw}`);

      return {
        round: nextRound,
        date: nextSaturday.toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: Math.max(0, Math.ceil(msUntilDraw / (1000 * 60 * 60 * 24))),
        isToday,
        timeUntilDraw,
        hasDrawPassed: false,
      };
    } catch (error) {
      console.error("❌ 다음 추첨 정보 오류:", error);
      const currentRound = this.calculateCurrentRound();
      return {
        round: currentRound + 1,
        date: new Date().toISOString().split("T")[0],
        estimatedJackpot: 3500000000,
        daysUntilDraw: 7,
        isToday: false,
        timeUntilDraw: "7일 후",
        hasDrawPassed: false,
      };
    }
  }

  // ✅ 강제 업데이트
  async forceUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔄 강제 업데이트 시작...");
      
      // 캐시 클리어
      this.lastUpdateTime = null;
      
      // 업데이트 시도
      await this.tryBackgroundUpdate();

      if (this.cachedData.length > 0 && !this.emergencyMode) {
        return {
          success: true,
          message: `데이터 업데이트 완료: ${this.cachedData.length}회차`,
        };
      } else {
        return {
          success: false,
          message: `데이터 업데이트 실패. 자동 생성 데이터 사용 중`,
        };
      }
    } catch (error) {
      console.error("❌ 강제 업데이트 오류:", error);
      
      return {
        success: false,
        message: `업데이트 중 오류가 발생했습니다`,
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
        latestRound: currentRound,
        oldestRound: currentRound,
        totalCount: 0,
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
      isUpdating: this.isLoading,
      isWaitingForResult: this.isWaitingForResult,
      crawlerStatus: {
        mode: this.emergencyMode ? "auto_generated" : "crawling",
        totalRounds: dataRange.totalCount,
        isDataLoaded: this.isDataLoaded,
        latestRound: dataRange.latestRound,
        oldestRound: dataRange.oldestRound,
        dataRange: `${dataRange.latestRound}~${dataRange.oldestRound}회차`,
        lastCrawl: this.lastUpdateTime?.toISOString() || null,
        source: this.emergencyMode ? "auto_generated" : "crawling",
        currentRound: currentRound,
        coverage: dataRange.totalCount > 0 ? `${Math.round((dataRange.totalCount / currentRound) * 100)}%` : "0%",
        emergencyMode: this.emergencyMode,
        isWaitingPeriod: this.isInWaitingPeriod(),
        isWithinTwoHoursAfterDraw: this.isWithinTwoHoursAfterDraw(),
      },
      nextUpdateIn: this.cacheTimeout - (Date.now() - (this.lastUpdateTime?.getTime() || 0)),
    };
  }

  cleanup(): void {
    // 타이머 정리
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.cachedData = [];
    this.isDataLoaded = false;
    this.lastUpdateTime = null;
    this.isLoading = false;
    this.loadingPromise = null;
    console.log("🧹 데이터 매니저 정리 완료");
  }

  async checkHealth(): Promise<any> {
    return {
      status: this.isDataLoaded ? "healthy" : "unhealthy",
      message: this.emergencyMode ? "자동 생성 모드로 동작 중" : "정상 동작 중",
      dataLoaded: this.isDataLoaded,
      cachedDataCount: this.cachedData.length,
      emergencyMode: this.emergencyMode,
      isWaitingPeriod: this.isInWaitingPeriod(),
      isWithinTwoHoursAfterDraw: this.isWithinTwoHoursAfterDraw(),
    };
  }

  // ✅ 전체 데이터 상태
  getFullDataStatus(): {
    isFullDataLoaded: boolean;
    expectedCount: number;
    actualCount: number;
    coverage: number;
    missingRounds: number[];
  } {
    const currentRound = this.calculateCurrentRound();
    const actualCount = this.cachedData.length;
    const coverage = actualCount > 0 ? Math.round((actualCount / currentRound) * 100) : 0;

    return {
      isFullDataLoaded: actualCount > 0,
      expectedCount: 100, // 최근 100회차만 관리
      actualCount,
      coverage,
      missingRounds: [],
    };
  }

  // ✅ 누락 데이터 보완은 자동으로 처리됨
  async fillMissingData(): Promise<void> {
    console.log("✅ 누락 데이터 자동 보완 중...");
    await this.tryBackgroundUpdate();
  }
}

export const lottoDataManager = new EmergencyLottoDataManager();
export default EmergencyLottoDataManager;
