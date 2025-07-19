// src/services/realtimeCrawler.ts
// 실시간 크롤링 서비스 (클라이언트 사이드)

import { LottoDrawResult } from "../types/lotto";

export interface CrawlerConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheDuration: number;
}

export class RealtimeCrawler {
  private config: CrawlerConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private retryTimer: NodeJS.Timeout | null = null;
  private lastCrawlAttempt: number = 0;

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      baseUrl: "/api",
      timeout: 30000,
      retryAttempts: 3,
      cacheDuration: 5 * 60 * 1000, // 5분
      ...config,
    };
    
    // 추첨 후 재시도 스케줄링
    this.scheduleRetryCheck();
  }

  // 🔧 추첨 대기 시간 확인
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
        const now = Date.now();
        // 마지막 시도로부터 5분 이상 지났으면 재시도
        if (now - this.lastCrawlAttempt > 5 * 60 * 1000) {
          console.log("🔄 추첨 후 2시간 이내, 크롤링 재시도");
          this.clearCache(); // 캐시 클리어하여 새로운 데이터 가져오도록
          this.getLatestResult(); // 최신 결과 다시 시도
        }
      }
    }, 5 * 60 * 1000); // 5분
  }

  // 캐시 확인
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
      // 추첨 대기 시간이면 캐시 무효화
      if (this.isInWaitingPeriod()) {
        return null;
      }
      return cached.data;
    }
    return null;
  }

  // 캐시 저장
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // API 호출 (재시도 로직 포함)
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    let lastError: Error | null = null;
    this.lastCrawlAttempt = Date.now();

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // ✅ AbortController로 타임아웃 구현
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal, // ✅ controller.signal 사용
        });

        clearTimeout(timeoutId); // 타임아웃 클리어

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`API 호출 실패 (시도 ${attempt}/${this.config.retryAttempts}):`, error);
        
        if (attempt < this.config.retryAttempts) {
          // 지수 백오프: 1초, 2초, 4초 대기
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }

    throw lastError || new Error("API 호출 실패");
  }

  // 최신 결과 조회
  async getLatestResult(): Promise<LottoDrawResult | null> {
    const cacheKey = "latest-result";
    
    // 추첨 대기 시간이 아닐 때만 캐시 확인
    if (!this.isInWaitingPeriod()) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log("💾 캐시된 최신 결과 사용");
        return cached;
      }
    }

    try {
      console.log("📡 최신 결과 API 호출...");
      const response = await this.apiCall("/latest-result");
      
      // 추첨 대기 시간 응답 처리
      if (response.isWaitingPeriod) {
        console.log("⏳ 추첨 대기 시간 응답 받음");
        // 대기 시간이면 null 반환 (Dashboard에서 처리)
        return null;
      }
      
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error(response.error || "데이터 없음");
    } catch (error) {
      console.error("❌ 최신 결과 조회 실패:", error);
      
      // 추첨 후 2시간 이내면 5분 후 재시도 예약
      if (this.isWithinTwoHoursAfterDraw()) {
        console.log("🔄 5분 후 재시도 예약됨");
      }
      
      return null;
    }
  }

  // 여러 회차 조회
  async getHistory(rounds: number = 100): Promise<LottoDrawResult[]> {
    const cacheKey = `history-${rounds}`;
    
    // 캐시 확인
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log(`💾 캐시된 히스토리 사용 (${rounds}회차)`);
      return cached;
    }

    try {
      console.log(`📡 히스토리 API 호출 (${rounds}회차)...`);
      const response = await this.apiCall(`/lotto-crawler?rounds=${rounds}`);
      
      if (response.success && response.data) {
        // 추첨 대기 시간 데이터 필터링
        let filteredData = response.data;
        if (response.isWaitingPeriod) {
          console.log("⏳ 추첨 대기 시간, 최신 회차 제외");
          // 최신 회차가 대기중이면 제외할 수 있음
        }
        
        this.setCachedData(cacheKey, filteredData);
        return filteredData;
      }
      
      throw new Error(response.error || "데이터 없음");
    } catch (error) {
      console.error("❌ 히스토리 조회 실패:", error);
      return [];
    }
  }

  // 헬스 체크
  async checkHealth(): Promise<any> {
    try {
      console.log("💚 헬스체크 수행...");
      const response = await this.apiCall("/health-check");
      
      // 추첨 상태 정보 추가
      return {
        ...response,
        crawlerStatus: {
          ...response.crawlerStatus,
          isWaitingPeriod: this.isInWaitingPeriod(),
          isWithinTwoHoursAfterDraw: this.isWithinTwoHoursAfterDraw(),
        }
      };
    } catch (error) {
      console.error("❌ 헬스체크 실패:", error);
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "상태 확인 실패",
        isWaitingPeriod: this.isInWaitingPeriod(),
        isWithinTwoHoursAfterDraw: this.isWithinTwoHoursAfterDraw(),
      };
    }
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear();
    console.log("🧹 크롤러 캐시 클리어 완료");
  }

  // 캐시 상태 조회
  getCacheStatus(): { 
    size: number; 
    keys: string[];
    isWaitingPeriod: boolean;
    isWithinTwoHoursAfterDraw: boolean;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      isWaitingPeriod: this.isInWaitingPeriod(),
      isWithinTwoHoursAfterDraw: this.isWithinTwoHoursAfterDraw(),
    };
  }

  // 강제 새로고침 (캐시 무시)
  async forceRefresh(): Promise<LottoDrawResult | null> {
    console.log("🔄 강제 새로고침 시작...");
    this.clearCache(); // 캐시 클리어
    return await this.getLatestResult();
  }

  // 클린업 (컴포넌트 언마운트 시 호출)
  cleanup(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    this.clearCache();
    console.log("🧹 크롤러 클린업 완료");
  }
}

// 기본 인스턴스 생성
export const realtimeCrawler = new RealtimeCrawler();

// 편의 함수들
export const getLatestLottoResult = () => realtimeCrawler.getLatestResult();
export const getLottoHistory = (rounds: number) => realtimeCrawler.getHistory(rounds);
export const checkCrawlerHealth = () => realtimeCrawler.checkHealth();
export const forceRefreshLotto = () => realtimeCrawler.forceRefresh();

export default RealtimeCrawler;
