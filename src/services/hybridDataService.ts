// src/services/hybridDataService.ts
// 정적 파일 + 최신 데이터만 크롤링하는 최적화된 서비스

import { fetchOfficialLottoData, calculateCurrentRound } from './unifiedLottoService';

export interface FullLottoData {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
  source: 'static' | 'official' | 'realtime';
}

// 정적 데이터 캐시
let staticDataCache: FullLottoData[] | null = null;
let lastUpdateRound: number = 0;

// 정적 데이터 로드 (public/data/lotto_all_data.json)
async function loadStaticData(): Promise<FullLottoData[]> {
  try {
    // 캐시가 있으면 재사용
    if (staticDataCache && staticDataCache.length > 0) {
      console.log('💾 캐시된 정적 데이터 사용');
      return staticDataCache;
    }

    console.log('📂 정적 데이터 파일 로딩...');
    const response = await fetch('/data/lotto_all_data.json');
    
    if (!response.ok) {
      throw new Error('정적 데이터 파일을 찾을 수 없습니다');
    }

    const data = await response.json();
    
    // 데이터 형식 변환 및 소스 표시
    staticDataCache = data.map((item: any) => ({
      round: item.round,
      date: item.date,
      numbers: Array.isArray(item.numbers) ? item.numbers : [],
      bonusNumber: item.bonusNumber,
      source: 'static' as const
    }));

    // 마지막 정적 데이터 회차 기록
    if (staticDataCache.length > 0) {
      const rounds = staticDataCache.map(d => d.round);
      lastUpdateRound = Math.max(...rounds);
      console.log(`✅ 정적 데이터 로드 완료: ${staticDataCache.length}개 (1~${lastUpdateRound}회차)`);
    }

    return staticDataCache;
  } catch (error) {
    console.error('❌ 정적 데이터 로드 실패:', error);
    return [];
  }
}

// 최신 데이터만 크롤링 (정적 데이터 이후 회차만)
async function fetchNewDataOnly(): Promise<FullLottoData[]> {
  try {
    const currentRound = calculateCurrentRound();
    
    // 정적 데이터의 마지막 회차 확인
    if (lastUpdateRound === 0) {
      await loadStaticData(); // 정적 데이터 먼저 로드
    }

    // 새로운 데이터가 없으면 빈 배열 반환
    if (currentRound <= lastUpdateRound) {
      console.log('📊 새로운 데이터 없음 (최신 데이터까지 이미 포함됨)');
      return [];
    }

    console.log(`🔄 새로운 데이터 확인: ${lastUpdateRound + 1}~${currentRound}회차`);
    
    const newData: FullLottoData[] = [];
    const startRound = lastUpdateRound + 1;
    const endRound = currentRound;
    
    // 새로운 회차만 크롤링 (보통 1-2개)
    for (let round = startRound; round <= endRound; round++) {
      try {
        const result = await fetchOfficialLottoData(round);
        if (result) {
          newData.push({
            round: result.round,
            date: result.date,
            numbers: result.numbers,
            bonusNumber: result.bonusNumber,
            source: 'realtime' as const
          });
          console.log(`✅ ${round}회차 새 데이터 수집 완료`);
        }
      } catch (error) {
        console.error(`❌ ${round}회차 크롤링 실패:`, error);
      }
    }

    if (newData.length > 0) {
      console.log(`🎯 새로운 데이터 ${newData.length}개 수집 완료`);
    }

    return newData;
  } catch (error) {
    console.error('❌ 새 데이터 크롤링 실패:', error);
    return [];
  }
}

// 전체 데이터 가져오기 (정적 + 최신)
export async function fetchAllLottoData(): Promise<FullLottoData[]> {
  try {
    console.log('🚀 최적화된 데이터 로딩 시작...');
    const startTime = Date.now();

    // 1. 정적 데이터 로드 (빠름!)
    const staticData = await loadStaticData();
    console.log(`⚡ 정적 데이터 로드: ${Date.now() - startTime}ms`);

    // 2. 새로운 데이터만 확인 (최소한의 API 호출)
    const newData = await fetchNewDataOnly();
    console.log(`⚡ 새 데이터 확인: ${Date.now() - startTime}ms`);

    // 3. 데이터 병합
    const allData = [...staticData, ...newData];
    
    // 회차순 정렬 및 중복 제거
    const uniqueData = Array.from(
      new Map(allData.map(item => [item.round, item])).values()
    ).sort((a, b) => a.round - b.round);

    const totalTime = Date.now() - startTime;
    console.log(`✅ 전체 데이터 로딩 완료: ${uniqueData.length}개 회차 (${totalTime}ms)`);
    
    // 데이터 통계
    const stats = getDataStats(uniqueData);
    console.log(`📊 데이터 구성: 정적 ${stats.sources.static || 0}개, 실시간 ${stats.sources.realtime || 0}개`);

    return uniqueData;
  } catch (error) {
    console.error('❌ 데이터 로딩 실패:', error);
    
    // 정적 데이터라도 반환
    if (staticDataCache && staticDataCache.length > 0) {
      console.log('⚠️ 새 데이터 로드 실패, 정적 데이터만 사용');
      return staticDataCache;
    }
    
    return [];
  }
}

// 데이터 통계
export function getDataStats(data: FullLottoData[]) {
  const sourceCount = data.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rounds = data.map(d => d.round);
  
  return {
    total: data.length,
    sources: sourceCount,
    latestRound: Math.max(...rounds),
    oldestRound: Math.min(...rounds),
    lastStaticRound: lastUpdateRound,
    currentRound: calculateCurrentRound()
  };
}

// 캐시 초기화
export function clearCache() {
  staticDataCache = null;
  lastUpdateRound = 0;
  console.log('🧹 데이터 캐시 초기화');
}

// 새 데이터 확인 (수동 새로고침용)
export async function checkForNewData(): Promise<{
  hasNewData: boolean;
  newCount: number;
  latestRound: number;
}> {
  const currentRound = calculateCurrentRound();
  
  // 정적 데이터가 로드되지 않았으면 먼저 로드
  if (lastUpdateRound === 0) {
    await loadStaticData();
  }
  
  const hasNewData = currentRound > lastUpdateRound;
  const newCount = hasNewData ? currentRound - lastUpdateRound : 0;
  
  return {
    hasNewData,
    newCount,
    latestRound: currentRound
  };
}

// localStorage에 최신 데이터 저장 (선택사항)
export function saveLatestDataToLocal(data: FullLottoData[]): void {
  try {
    const latestData = data.filter(d => d.source === 'realtime');
    if (latestData.length > 0) {
      localStorage.setItem('lotto_latest_updates', JSON.stringify({
        data: latestData,
        updatedAt: new Date().toISOString(),
        lastRound: Math.max(...latestData.map(d => d.round))
      }));
      console.log('💾 최신 데이터 로컬 저장 완료');
    }
  } catch (error) {
    console.error('로컬 저장 실패:', error);
  }
}

// localStorage에서 최신 데이터 로드 (선택사항)
export function loadLatestDataFromLocal(): FullLottoData[] {
  try {
    const saved = localStorage.getItem('lotto_latest_updates');
    if (saved) {
      const { data } = JSON.parse(saved);
      console.log('💾 로컬 저장된 최신 데이터 로드');
      return data;
    }
  } catch (error) {
    console.error('로컬 로드 실패:', error);
  }
  return [];
}
