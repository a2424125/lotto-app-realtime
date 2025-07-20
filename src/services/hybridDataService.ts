import { fetchOfficialLottoData, calculateCurrentRound } from './unifiedLottoService';
import { fetchBulkFromLottolyzer } from './lottolyzerService';

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
  
  // 1. 최신 10개 회차 - 동행복권 공식 API
  console.log(`📊 공식 API: ${officialStartRound}~${currentRound}회차`);
  const officialPromises = [];
  for (let round = officialStartRound; round <= currentRound; round++) {
    officialPromises.push(fetchOfficialLottoData(round));
  }
  
  // 2. 나머지 과거 데이터 - Lottolyzer
  const pastDataCount = officialStartRound - 1;
  console.log(`📊 Lottolyzer: 1~${pastDataCount}회차`);
  
  // 병렬 처리
  const [officialResults, lottolyzerResults] = await Promise.all([
    Promise.all(officialPromises),
    fetchBulkFromLottolyzer(pastDataCount)
  ]);
  
  // 3. 데이터 합치기
  const allData: FullLottoData[] = [];
  
  // Lottolyzer 데이터 추가
  lottolyzerResults.forEach(result => {
    allData.push({
      ...result,
      source: 'lottolyzer'
    });
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
  
  console.log(`✅ 전체 ${allData.length}개 회차 데이터 수집 완료!`);
  return allData;
}
