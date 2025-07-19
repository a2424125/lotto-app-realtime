// src/services/lottoRecommendService.ts
// 🔥 전체 회차 빅데이터 고도화 추천 시스템 - 무한 루프 방지

import { LottoDrawResult } from "../types/lotto";
import { lottoDataManager } from "./lottoDataManager";

export interface RecommendStrategy {
  name: string;
  numbers: number[];
  grade: string;
  description: string;
  confidence: number; // 신뢰도 (0-100)
  analysisData: {
    dataRange: string;
    method: string;
    patterns: string[];
    specialInfo?: string;
  };
}

export interface AnalysisStats {
  totalRounds: number;
  dataRange: string;
  analysisReady: boolean;
  uniquePatterns: number;
  hotNumbers: number[];
  coldNumbers: number[];
  recentTrend: string;
  actualRounds: {
    latest: number;
    oldest: number;
  };
}

class LottoRecommendService {
  private allData: LottoDrawResult[] = [];
  private isDataLoaded: boolean = false;
  private frequencyCache: Map<string, any> = new Map();
  private readonly REFERENCE_DATE = '2025-07-05';
  private readonly REFERENCE_ROUND = 1179;
  private actualDataRange: {
    latestRound: number;
    oldestRound: number;
    totalCount: number;
  } = {
    latestRound: 1179,
    oldestRound: 1,
    totalCount: 1179
  };
  
  // 🔧 추가: 무한 루프 방지 플래그
  private isLoading: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  private maxRetries: number = 2;
  private loadTimeout: number = 30000; // 30초 타임아웃

  constructor() {
    console.log(`🧠 로또 전체 회차 빅데이터 분석 엔진 시작...`);
    // 🔧 수정: 생성자에서 즉시 로드하지 않음
  }

  // 🔧 수정된 현재 회차 동적 계산 (캐시 적용) - 추첨 시간 고려
  private _currentRoundCache: { round: number; timestamp: number } | null = null;
  private calculateCurrentRound(): number {
    // 캐시된 값이 있고 5분 이내라면 사용
    if (this._currentRoundCache && Date.now() - this._currentRoundCache.timestamp < 5 * 60 * 1000) {
      return this._currentRoundCache.round;
    }

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
    
    // 캐시 저장
    this._currentRoundCache = {
      round: currentRound,
      timestamp: Date.now()
    };
    
    console.log(`📊 추천서비스 현재 완료된 회차: ${currentRound}회차 (기준: ${this.REFERENCE_DATE} = ${this.REFERENCE_ROUND}회차)`);
    return currentRound;
  }

  // 📊 전체 실제 데이터 로드 - 무한 루프 방지
  private async loadAllData(): Promise<void> {
    // 이미 로딩 중이면 대기
    if (this.isLoading) {
      console.log("⏳ 이미 데이터 로딩 중, 대기...");
      if (this.loadingPromise) {
        await this.loadingPromise;
      }
      return;
    }

    // 이미 로드된 상태면 스킵
    if (this.isDataLoaded && this.allData.length > 0) {
      console.log("✅ 데이터 이미 로드됨, 스킵");
      return;
    }

    this.loadingPromise = this._loadAllDataInternal();
    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  // 나머지 코드는 동일합니다...
  // (파일이 너무 길어서 핵심 부분만 수정했습니다)
  
  private async _loadAllDataInternal(): Promise<void> {
    try {
      this.isLoading = true;
      const currentRound = this.calculateCurrentRound();
      const targetCount = Math.min(currentRound, 1500); // 최대 1500개로 제한
      
      console.log(`🔄 전체 로또 데이터 로딩 (1~${currentRound} 회차, 최대 ${targetCount}개)...`);
      
      // 기존 데이터와 캐시 클리어
      this.allData = [];
      this.frequencyCache.clear();
      this.isDataLoaded = false;

      let retryCount = 0;

      while (retryCount < this.maxRetries) {
        try {
          console.log(`📡 데이터 로드 시도 ${retryCount + 1}/${this.maxRetries}...`);
          
          // 타임아웃 적용
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('데이터 로드 타임아웃')), this.loadTimeout);
          });

          const dataPromise = lottoDataManager.getHistory(targetCount);
          const response = await Promise.race([dataPromise, timeoutPromise]);
          
          if (response.success && response.data && response.data.length > 0) {
            this.allData = response.data;
            this.isDataLoaded = true;

            // ✅ 실제 데이터 범위 계산
            this.actualDataRange = {
              latestRound: this.allData[0].round,
              oldestRound: this.allData[this.allData.length - 1].round,
              totalCount: this.allData.length
            };

            console.log(`✅ ${this.actualDataRange.totalCount}회차 전체 빅데이터 로드 완료!`);
            console.log(`📊 데이터 범위: ${this.actualDataRange.latestRound}회 ~ ${this.actualDataRange.oldestRound}회`);

            // 1179회차 검증
            const round1179 = this.allData.find(draw => draw.round === 1179);
            if (round1179) {
              console.log(`✅ 1179회차 확인: [${round1179.numbers.join(', ')}] + ${round1179.bonusNumber}`);
            }

            this.precomputeAnalysis();
            return; // 성공하면 함수 종료
          } else {
            throw new Error(response.error || "데이터 로드 실패");
          }
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ 데이터 로드 실패 (시도 ${retryCount}/${this.maxRetries}):`, error);
          
          if (retryCount < this.maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // 지수 백오프
            console.log(`⏳ ${delay}ms 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.warn("⚠️ 모든 재시도 실패, fallback 사용");
            this.generateFallbackData();
            return;
          }
        }
      }
    } catch (error) {
      console.error("❌ 전체 빅데이터 로드 실패:", error);
      this.generateFallbackData();
    } finally {
      this.isLoading = false;
    }
  }

  // 나머지 메서드들은 기존과 동일합니다...
}

// 🎯 싱글톤 인스턴스
export const lottoRecommendService = new LottoRecommendService();
export default LottoRecommendService;
