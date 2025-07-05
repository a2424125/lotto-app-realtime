// 🔧 src/types/lotto.ts
// 실시간 크롤링 시스템용 타입 정의 - 추첨일 관련 타입 업데이트

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
  // 🔧 추첨전 상태 관련 추가
  status?: "winning" | "losing" | "pending";
  message?: string;
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

// 🔧 수정된 다음 추첨 정보 타입 - 정확한 시간 계산 포함
export interface NextDrawInfo {
  round: number;
  date: string; // YYYY-MM-DD 형식
  estimatedJackpot: number;
  daysUntilDraw: number; // 정확한 일수 (0 = 오늘)
  isToday: boolean; // 오늘이 추첨일인지
  timeUntilDraw: string; // 사용자 친화적 시간 표시 ("오늘 추첨!", "내일 추첨!" 등)
  hasDrawPassed: boolean; // 추첨 시간이 지났는지
  formattedDate?: string; // 한국어 포맷팅된 날짜
  // 🆕 정확한 시간 계산 관련
  drawDateTime?: Date; // 정확한 추첨 일시 (토요일 오후 8시 35분)
  minutesUntilDraw?: number; // 추첨까지 남은 분수
  hoursUntilDraw?: number; // 추첨까지 남은 시간수
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

// 🔧 수정된 실시간 데이터 매니저 상태 타입 - 추첨일 정보 포함
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
  nextDrawInfo?: NextDrawInfo; // 🔧 업데이트된 타입 사용
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

// 🔧 수정된 실시간 알림 타입 - 추첨일 관련 알림 추가
export interface RealtimeNotification {
  id: string;
  type: "new_draw" | "draw_today" | "draw_soon" | "system_update" | "error" | "maintenance";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data?: any;
  priority: "low" | "medium" | "high" | "critical";
  // 🔧 추첨일 관련 추가
  drawInfo?: {
    isToday: boolean;
    hoursUntilDraw?: number;
    round?: number;
  };
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

// 🔧 수정된 실시간 앱 설정 타입 - 추첨일 알림 설정 포함
export interface RealtimeAppSettings {
  theme: "light" | "dark";
  autoSave: boolean;
  notifications: {
    drawResults: boolean;
    systemUpdates: boolean;
    errors: boolean;
    drawReminders: boolean; // 🔧 추첨일 리마인더 알림
    todayDraw: boolean; // 🔧 오늘 추첨 알림
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
  // 🔧 추첨일 관련 설정 추가
  drawSettings: {
    showTodayIndicator: boolean;
    showCountdown: boolean;
    reminderHoursBefore: number; // 몇 시간 전에 알림할지
    autoCheckAfterDraw: boolean; // 추첨 후 자동 당첨 확인
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

// 🔧 추첨일 계산 관련 유틸리티 타입들
export interface DrawTimeCalculation {
  nextDrawDate: Date;
  currentTime: Date;
  daysUntilDraw: number;
  hoursUntilDraw: number;
  minutesUntilDraw: number;
  isToday: boolean;
  isTomorrow: boolean;
  hasDrawPassed: boolean;
  timeMessage: string;
  urgencyLevel: "low" | "medium" | "high" | "critical"; // 추첨까지 남은 시간에 따른 긴급도
}

export interface DrawScheduleInfo {
  dayOfWeek: number; // 6 (토요일)
  hour: number; // 20 (오후 8시)
  minute: number; // 35 (35분)
  timezone: string; // "Asia/Seoul"
  description: string; // "매주 토요일 오후 8시 35분"
}

// 기존 타입들은 그대로 유지하되 실시간 기능 호환성 추가
export type DataSource =
  | "realtime_crawler"
  | "csv_fallback"
  | "cache"
  | "manual";
export type CrawlerStatus = "active" | "inactive" | "error" | "maintenance";
export type DataQuality = "high" | "medium" | "low" | "unknown";

// 🔧 추첨일 상태 타입 추가
export type DrawStatus = 
  | "waiting" // 추첨 대기중 (평상시)
  | "today" // 오늘 추첨
  | "soon" // 곧 추첨 (몇 시간 내)
  | "imminent" // 추첨 임박 (1시간 내)
  | "in_progress" // 추첨 진행중
  | "completed" // 추첨 완료
  | "results_pending"; // 결과 발표 대기

// 🆕 실시간 이벤트 타입
export interface RealtimeEvent {
  eventId: string;
  eventType: "data_update" | "new_draw" | "draw_reminder" | "system_status" | "user_action";
  timestamp: string;
  data: any;
  metadata?: {
    source: string;
    version: string;
    userId?: string;
  };
  // 🔧 추첨일 관련 이벤트 데이터
  drawEventData?: {
    round?: number;
    drawStatus?: DrawStatus;
    timeUntilDraw?: number;
    isToday?: boolean;
  };
}

// 🔧 Component Props 타입들도 업데이트
export interface DashboardProps {
  pastWinningNumbers: number[][];
  onMenuChange: (menu: string) => void;
  generate1stGradeNumbers: () => number[];
  onRefreshData?: () => void;
  isDataLoading?: boolean;
  dataStatus?: RealtimeDataStatus;
  roundRange?: {
    latestRound: number;
    oldestRound: number;
  };
  theme?: "light" | "dark";
  nextDrawInfo?: NextDrawInfo; // 🔧 업데이트된 타입 사용
}

export interface AppState {
  currentMenu: string;
  sidebarOpen: boolean;
  purchaseHistory: PurchaseItem[];
  theme: "light" | "dark";
  autoSave: boolean;
  pastWinningNumbers: number[][];
  roundRange: {
    latestRound: number;
    oldestRound: number;
  };
  isDataLoading: boolean;
  dataStatus: RealtimeDataStatus;
  nextDrawInfo: NextDrawInfo | null; // 🔧 업데이트된 타입 사용
  currentTime: Date; // 🔧 실시간 시간 추가
}
