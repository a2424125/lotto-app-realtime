// 동행복권 공식 API를 사용하는 통합 서비스
export interface LottoResult {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
  firstWinAmount?: number;
  firstWinCount?: number;
}

// 현재 회차 계산
export function calculateCurrentRound(): number {
  const referenceDate = new Date('2002-12-07'); // 1회차 추첨일
  const referenceRound = 1;
  const now = new Date();
  
  // 한국 시간으로 변환
  const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const koreaDay = koreaTime.getDay();
  const koreaHour = koreaTime.getHours();
  const koreaMinute = koreaTime.getMinutes();
  
  // 기준일부터 현재까지의 일수 계산
  const timeDiff = now.getTime() - referenceDate.getTime();
  const daysPassed = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  const weeksPassed = Math.floor(daysPassed / 7);
  
  // 기본 계산: 기준 회차 + 경과 주수
  let currentRound = referenceRound + weeksPassed;
  
  // 토요일이고 추첨 시간(20:35) 전이면 아직 이번 주 추첨이 안 됨
  if (koreaDay === 6 && (koreaHour < 20 || (koreaHour === 20 && koreaMinute < 35))) {
    currentRound = currentRound - 1;
  }
  
  return currentRound;
}

// 추첨 대기 시간 확인
export function isInWaitingPeriod(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const koreaDay = koreaTime.getDay();
  const koreaHour = koreaTime.getHours();
  const koreaMinute = koreaTime.getMinutes();
  
  // 토요일 20:35 ~ 21:00 사이인지 확인
  if (koreaDay === 6) {
    const totalMinutes = koreaHour * 60 + koreaMinute;
    const drawStartMinutes = 20 * 60 + 35; // 20:35
    const drawEndMinutes = 21 * 60; // 21:00
    
    return totalMinutes >= drawStartMinutes && totalMinutes <= drawEndMinutes;
  }
  
  return false;
}

// 동행복권 공식 API에서 데이터 가져오기 - 클라이언트/서버 환경 구분
export async function fetchOfficialLottoData(round: number): Promise<LottoResult | null> {
  try {
    console.log(`🎯 동행복권 API 호출: ${round}회차`);
    
    // 환경에 따라 URL 결정
    let apiUrl: string;
    
    if (typeof window !== 'undefined') {
      // 클라이언트 사이드: 상대 경로 사용
      apiUrl = `/api/dhlottery-proxy?drwNo=${round}`;
    } else {
      // 서버 사이드: 직접 동행복권 API 호출
      apiUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.returnValue === 'success') {
      const result: LottoResult = {
        round: data.drwNo,
        date: data.drwNoDate,
        numbers: [
          data.drwtNo1,
          data.drwtNo2,
          data.drwtNo3,
          data.drwtNo4,
          data.drwtNo5,
          data.drwtNo6
        ].sort((a, b) => a - b),
        bonusNumber: data.bnusNo,
        firstWinAmount: data.firstWinamnt,
        firstWinCount: data.firstPrzwnerCo
      };
      
      console.log(`✅ ${round}회차 데이터: [${result.numbers.join(', ')}] + ${result.bonusNumber}`);
      return result;
    }
    
    console.log(`❌ ${round}회차 데이터 없음`);
    return null;
    
  } catch (error) {
    console.error(`❌ ${round}회차 API 에러:`, error);
    return null;
  }
}

// 여러 회차 한번에 가져오기
export async function fetchMultipleRounds(count: number): Promise<LottoResult[]> {
  const currentRound = calculateCurrentRound();
  const results: LottoResult[] = [];
  
  // 병렬로 요청 (5개씩 묶어서)
  const batchSize = 5;
  for (let i = 0; i < count; i += batchSize) {
    const promises = [];
    
    for (let j = 0; j < batchSize && i + j < count; j++) {
      const round = currentRound - i - j;
      if (round > 0) {
        promises.push(fetchOfficialLottoData(round));
      }
    }
    
    const batchResults = await Promise.all(promises);
    
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }
    
    // API 부하 방지를 위한 짧은 대기
    if (i + batchSize < count) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
