import { fetchOfficialLottoData, calculateCurrentRound } from './unifiedLottoService';
import { fetchAllPagesFromLottolyzer } from './lottolyzerService';

export interface FullLottoData {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
  source: 'official' | 'lottolyzer';
}

// 하이브리드 방식으로 전체 데이터 가져오기
export async function fetchAllLottoData(): Promise<FullLottoData[]> {
  console.log('🚀 하이브리드 방식으로 전체 데이터 가져오기 시작...');
  
  const currentRound = calculateCurrentRound();
  const recentCount = 10; // 최신 10개는 공식 API
  const officialStartRound = currentRound - recentCount + 1;
  
  try {
    // 1. 최신 10개 회차 - 동행복권 공식 API
    console.log(`📊 공식 API: ${officialStartRound}~${currentRound}회차`);
    const officialPromises = [];
    for (let round = officialStartRound; round <= currentRound; round++) {
      officialPromises.push(fetchOfficialLottoData(round));
    }
    
    // 2. 나머지 과거 데이터 - Lottolyzer (여러 페이지)
    const pastDataCount = officialStartRound - 1;
    console.log(`📊 Lottolyzer: 1~${pastDataCount}회차 (여러 페이지로 나눠서)`);
    
    // 병렬 처리
    const [officialResults, lottolyzerResults] = await Promise.all([
      Promise.all(officialPromises),
      fetchAllPagesFromLottolyzer(pastDataCount) // 수정된 함수 사용
    ]);
    
    // 3. 데이터 합치기
    const allData: FullLottoData[] = [];
    
    // Lottolyzer 데이터 추가
    lottolyzerResults.forEach(result => {
      // 회차 범위 체크 (1 ~ pastDataCount)
      if (result.round >= 1 && result.round <= pastDataCount) {
        allData.push({
          ...result,
          source: 'lottolyzer'
        });
      }
    });
    
    // 공식 데이터 추가
    officialResults.forEach(result => {
      if (result) {
        allData.push({
          round: result.round,
          date: result.date,
          numbers: result.numbers,
          bonusNumber: result.bonusNumber,
          source: 'official'
        });
      }
    });
    
    // 회차 순으로 정렬
    allData.sort((a, b) => a.round - b.round);
    
    // 중복 제거 (혹시 겹치는 부분이 있을 경우)
    const uniqueData = Array.from(
      new Map(allData.map(item => [item.round, item])).values()
    );
    
    console.log(`✅ 전체 ${uniqueData.length}개 회차 데이터 수집 완료!`);
    console.log(`📊 데이터 범위: ${uniqueData[0]?.round}회 ~ ${uniqueData[uniqueData.length - 1]?.round}회`);
    
    return uniqueData;
    
  } catch (error) {
    console.error('❌ 하이브리드 데이터 수집 실패:', error);
    
    // 실패 시 최소한 공식 API 데이터라도 반환
    console.log('⚠️ 공식 API 데이터만 사용합니다...');
    
    const fallbackData: FullLottoData[] = [];
    
    for (let round = currentRound; round > Math.max(currentRound - 100, 1); round--) {
      try {
        const result = await fetchOfficialLottoData(round);
        if (result) {
          fallbackData.push({
            round: result.round,
            date: result.date,
            numbers: result.numbers,
            bonusNumber: result.bonusNumber,
            source: 'official'
          });
        }
      } catch (err) {
        // 개별 실패는 무시
      }
    }
    
    return fallbackData.sort((a, b) => a.round - b.round);
  }
}
