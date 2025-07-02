// 🔧 src/types/lotto.ts
// 실시간 크롤링 시스템용 타입 정의

export interface LottoDrawResult {
  round: number; // 회차
  date: string; // 추첨일 (YYYY-MM-DD)
  numbers: number[]; // 당첨번호 6개 (정렬됨)
  bonusNumber: number; // 보너스번호
  totalSales?: number; // 총 판매금액
  jackpotWinners?: number; // 1등 당첨자 수
  jackpotPrize?: number; // 1등 당첨금
  // 🆕 실시간 크롤링 관련 필드
  crawledAt?: string; // 크롤링 시각
  source?: string; // 데이터 소스 (예: "en.lottolyzer.com")
  isVerified?: boolean; // 데이터 검증 여부
}

export interface WinnerInfo {
  first: { count: number; prize: number };
  second: { count: number; prize: number };
  third: { count: number; prize: number };
  fourth: { count: number; prize: number };
  fifth: { count: number; prize: number };
}

export interface DetailedLottoResult extends LottoDrawResult {
  winners: WinnerInfo;
  nextJackpot?: number; // 다음회차 예상 당첨금
  // 🆕 실시간 크롤링 관련 추가 정보
  crawlingMetadata?: {
    responseTime: number; // 크롤링 응답 시간 (ms)
    dataQuality: "high" | "medium" | "low"; // 데이터 품질
    lastValidated: string; // 마지막 검증 시각
  };
}

export interface PurchaseItem {
  id: number;
  numbers: number[];
  strategy: string;
  date: string;
  checked: boolean;
  status: "saved" | "favorite" | "checked";
  memo?: string;
  purchaseDate?: string;
  // 🆕 실시간 당첨 확인 관련
  checkHistory?: {
    checkedAt: string;
    result?: CheckResult;
  }[];
}

export interface CheckResult {
  grade: string;
  matches: number;
  bonusMatch: boolean;
  winningNumbers?: number[];
  bonusNumber?: number;
  userNumbers?: number[];
  error?: string;
  // 🆕 실시간 확인 관련
  checkedAt?: string;
  drawDate?: string;
  isRealTimeCheck?: boolean;
}

export interface RecommendStrategy {
  name: string;
  numbers: number[];
  grade: string;
  description?: string;
  // 🆕 실시간 분석 정보 추가
  analysisTimestamp?: string;
  dataSourceRounds?: number;
  confidence?: number;
}

// 🆕 실시간 API 응답 타입들
export interface LottoAPIResponse {
  success: boolean;
  data?: LottoDrawResult;
  error?: string;
  message?: string;
  // 🆕 실시간 크롤링 관련
  crawledAt?: string;
  source?: string;
  responseTime?: number;
}

export interface LottoHistoryAPIResponse {
  success: boolean;
  data?: LottoDrawResult[];
  error?: string;
  message?: string;
  // 🆕 실시간 크롤링 관련
  crawledAt?: string;
  source?: string;
  totalCount?: number;
  dataRange?: string;
}

// 🆕 크롤링 시스템 관련 타입들
export interface CrawlResponse {
  success: boolean;
  data?: LottoDrawResult[];
  error?: string;
  message?: string;
  crawledAt: string;
  source: string;
  totalCount: number;
  metadata?: {
    responseTime: number;
    dataQuality: "high" | "medium" | "low";
    failedRounds?: number[];
    warnings?: string[];
  };
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    lottolyzer: {
      status: "up" | "down";
      responseTime?: number;
      lastCheck: string;
    };
    crawler: {
      status: "ready" | "busy" | "error";
      lastRun?: string;
      nextScheduled?: string;
    };
  };
  system: {
    memory: string;
    uptime: string;
    region: string;
  };
  version: string;
}

// 🆕 실시간 데이터 매니저 상태 타입
export interface RealtimeDataStatus {
  lastUpdate: Date | null;
  isRealTime: boolean;
  source: "realtime_crawler" | "fallback" | "cache";
  crawlerHealth?: "healthy" | "degraded" | "unhealthy" | "checking";
  roundRange?: {
    latestRound: number;
    oldestRound: number;
    totalCount: number;
  };
  nextDrawInfo?: {
    round: number;
    date: string;
    estimatedJackpot: number;
    daysUntilDraw: number;
  };
  crawlerInfo?: {
    version: string;
    source: string;
    updateInterval: string;
    health: string;
  };
  apiEndpoints?: {
    crawler: string;
    latestResult: string;
    healthCheck: string;
  };
}

// 🆕 크롤링 설정 타입
export interface CrawlerConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheDuration: number;
  updateInterval: number;
  healthCheckInterval: number;
  maxRoundsPerRequest: number;
}

// 🆕 실시간 알림 타입
export interface RealtimeNotification {
  id: string;
  type: "new_draw" | "system_update" | "error" | "maintenance";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data?: any;
  priority: "low" | "medium" | "high" | "critical";
}

// 🆕 크롤링 메트릭스 타입
export interface CrawlingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastSuccessfulCrawl: string;
  lastFailedCrawl?: string;
  dataQualityScore: number;
  uptime: number;
}

// 🆕 실시간 분석 결과 타입
export interface RealtimeAnalysisResult {
  analysisType: "frequency" | "pattern" | "trend" | "prediction";
  dataRange: {
    startRound: number;
    endRound: number;
    totalRounds: number;
  };
  results: any;
  confidence: number;
  generatedAt: string;
  dataSource: string;
  metadata: {
    processingTime: number;
    algorithmsUsed: string[];
    dataQuality: "high" | "medium" | "low";
  };
}

// 🆕 실시간 앱 설정 타입
export interface RealtimeAppSettings {
  theme: "light" | "dark";
  autoSave: boolean;
  notifications: {
    drawResults: boolean;
    systemUpdates: boolean;
    errors: boolean;
  };
  crawler: {
    autoUpdate: boolean;
    updateInterval: number;
    maxCacheAge: number;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    baseUrl?: string;
  };
  exportSettings: {
    includeMetadata: boolean;
    format: "json" | "csv" | "xlsx";
    compression: boolean;
  };
}

// 🆕 에러 타입 정의
export interface CrawlerError {
  code: string;
  message: string;
  timestamp: string;
  endpoint?: string;
  requestData?: any;
  stack?: string;
  isRecoverable: boolean;
}

// 🆕 실시간 통계 타입
export interface RealtimeStats {
  totalDrawsAnalyzed: number;
  analysisAccuracy: number;
  predictionSuccess: number;
  systemUptime: number;
  dataFreshness: number;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  performance: {
    averageApiResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

// 기존 타입들은 그대로 유지하되 실시간 기능 호환성 추가
export type DataSource =
  | "realtime_crawler"
  | "csv_fallback"
  | "cache"
  | "manual";
export type CrawlerStatus = "active" | "inactive" | "error" | "maintenance";
export type DataQuality = "high" | "medium" | "low" | "unknown";

// 🆕 실시간 이벤트 타입
export interface RealtimeEvent {
  eventId: string;
  eventType: "data_update" | "new_draw" | "system_status" | "user_action";
  timestamp: string;
  data: any;
  metadata?: {
    source: string;
    version: string;
    userId?: string;
  };
}
