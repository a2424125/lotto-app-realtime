import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LottolyzerResult {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
}

// 단일 페이지 크롤링 - 프록시 API 사용
async function fetchSinglePage(page: number, perPage: number = 50): Promise<LottolyzerResult[]> {
  try {
    console.log(`📄 Lottolyzer ${page}페이지 크롤링 중...`);
    
    const { data: html } = await axios.get(`/api/lottolyzer-proxy`, {
      params: {
        page: page,
        perPage: perPage
      },
      timeout: 30000, // 타임아웃 늘림
    });
    
    const $ = cheerio.load(html);
    const results: LottolyzerResult[] = [];
    
    // 테이블이 없으면 마지막 페이지일 가능성
    const tableExists = $("table tbody tr").length > 0;
    if (!tableExists) {
      console.log(`⚠️ ${page}페이지: 테이블 없음 (마지막 페이지일 가능성)`);
      return [];
    }
    
    $("table tbody tr").each((i, row) => {
      const cells = $(row).find("td");
      const roundText = cells.eq(0).text().trim();
      const round = parseInt(roundText);
      
      if (isNaN(round)) return;
      
      // 날짜
      const dateText = cells.eq(1).text().trim();
      let date = "";
      const dateMatch = dateText.match(/(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})/);
      if (dateMatch) {
        date = new Date(dateMatch[1].replace(/\./g, "-")).toISOString().split('T')[0];
      }
      
      // 번호들
      const numbers: number[] = [];
      let bonus = 0;
      
      cells.each((j, cell) => {
        if (j <= 1) return; // 회차, 날짜 스킵
        
        const num = parseInt($(cell).text().trim());
        if (!isNaN(num) && num >= 1 && num <= 45) {
          if (numbers.length < 6) {
            numbers.push(num);
          } else if (bonus === 0) {
            bonus = num;
          }
        }
      });
      
      if (numbers.length === 6 && bonus > 0) {
        results.push({
          round,
          date,
          numbers: numbers.sort((a, b) => a - b),
          bonusNumber: bonus
        });
      }
    });
    
    console.log(`✅ ${page}페이지: ${results.length}개 데이터 수집`);
    return results;
    
  } catch (error) {
    console.error(`❌ ${page}페이지 크롤링 실패:`, error);
    return [];
  }
}

// 전체 페이지 크롤링 - 개선된 버전
export async function fetchAllPagesFromLottolyzer(targetCount: number): Promise<LottolyzerResult[]> {
  try {
    console.log(`🔍 Lottolyzer에서 ${targetCount}개 데이터 크롤링 시작...`);
    
    const perPage = 50;
    const totalPages = Math.ceil(targetCount / perPage);
    const allResults: LottolyzerResult[] = [];
    
    console.log(`📊 예상 필요 페이지: ${totalPages}개`);
    
    // 배치 처리 개선 - 더 작은 배치로
    const batchSize = 2; // 동시 요청 수 줄임
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3; // 연속 실패 시 중단
    
    for (let i = 0; i < totalPages; i += batchSize) {
      const promises = [];
      
      for (let j = 0; j < batchSize && i + j < totalPages; j++) {
        const page = i + j + 1;
        promises.push(fetchSinglePage(page, perPage));
      }
      
      const batchResults = await Promise.all(promises);
      
      // 결과 확인
      let hasValidResults = false;
      batchResults.forEach(pageResults => {
        if (pageResults.length > 0) {
          allResults.push(...pageResults);
          hasValidResults = true;
          consecutiveFailures = 0;
        }
      });
      
      // 연속 실패 체크
      if (!hasValidResults) {
        consecutiveFailures++;
        console.log(`⚠️ 연속 실패: ${consecutiveFailures}회`);
        
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(`❌ 연속 ${maxConsecutiveFailures}회 실패로 크롤링 중단`);
          break;
        }
      }
      
      console.log(`📈 진행률: ${allResults.length}/${targetCount}개 수집 (${((i + batchSize) / totalPages * 100).toFixed(1)}%)`);
      
      // 목표 개수에 도달하면 중단
      if (allResults.length >= targetCount) {
        console.log(`✅ 목표 개수 도달!`);
        break;
      }
      
      // API 부하 방지를 위한 대기 시간 늘림
      if (i + batchSize < totalPages) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 중복 제거 및 정렬
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.round, item])).values()
    ).sort((a, b) => a.round - b.round);
    
    console.log(`✅ Lottolyzer 크롤링 완료: ${uniqueResults.length}개 (목표: ${targetCount}개)`);
    
    // 수집률 로그
    const collectionRate = (uniqueResults.length / targetCount * 100).toFixed(1);
    console.log(`📊 수집률: ${collectionRate}%`);
    
    return uniqueResults;
    
  } catch (error) {
    console.error('❌ Lottolyzer 전체 크롤링 실패:', error);
    return [];
  }
}

// 기존 함수 유지
export async function fetchBulkFromLottolyzer(count: number, offset: number = 0): Promise<LottolyzerResult[]> {
  const page = Math.floor(offset / 50) + 1;
  return fetchSinglePage(page, Math.min(count, 50));
}
