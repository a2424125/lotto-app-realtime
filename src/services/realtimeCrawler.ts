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

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      baseUrl: "/api",
      timeout: 30000,
      retryAttempts: 3,
      cacheDuration: 5 * 60 * 1000, // 5분
      ...config,
    };
  }

  // 캐시 확인
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
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

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
    
    // 캐시 확인
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log("💾 캐시된 최신 결과 사용");
      return cached;
    }

    try {
      console.log("📡 최신 결과 API 호출...");
      const response = await this.apiCall("/latest-result");
      
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error(response.error || "데이터 없음");
    } catch (error) {
      console.error("❌ 최신 결과 조회 실패:", error);
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
        this.setCachedData(cacheKey, response.data);
        return response.data;
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
      return response;
    } catch (error) {
      console.error("❌ 헬스체크 실패:", error);
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "상태 확인 실패",
      };
    }
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear();
    console.log("🧹 크롤러 캐시 클리어 완료");
  }

  // 캐시 상태 조회
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 기본 인스턴스 생성
export const realtimeCrawler = new RealtimeCrawler();

// 편의 함수들
export const getLatestLottoResult = () => realtimeCrawler.getLatestResult();
export const getLottoHistory = (rounds: number) => realtimeCrawler.getHistory(rounds);
export const checkCrawlerHealth = () => realtimeCrawler.checkHealth();

export default RealtimeCrawler;
