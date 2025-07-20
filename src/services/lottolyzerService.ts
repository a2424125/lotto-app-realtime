import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LottolyzerResult {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
}

// 단일 페이지 크롤링 - 프록시 API 사용으로 수정
async function fetchSinglePage(page: number, perPage: number = 50): Promise<LottolyzerResult[]> {
  try {
    console.log(`📄 Lottolyzer ${page}페이지 크롤링 중...`);
    
    // 🔥 수정된 부분: 직접 외부 사이트 호출 대신 프록시 API 호출
    const { data: html } = await axios.get(`/api/lottolyzer-proxy`, {
      params: {
        page: page,
        perPage: perPage
      },
      timeout: 15000, // 타임아웃 약간 늘림
    });
    
    const $ = cheerio.load(html);
    const results: LottolyzerResult[] = [];
    
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

// 전체 페이지 크롤링 (변경 없음)
export async function fetchAllPagesFromLottolyzer(targetCount: number): Promise<LottolyzerResult[]> {
  try {
    console.log(`🔍 Lottolyzer에서 ${targetCount}개 데이터를 여러 페이지로 나눠 가져오기...`);
    
    const perPage = 50; // 페이지당 최대 개수
    const totalPages = Math.ceil(targetCount / perPage);
    const allResults: LottolyzerResult[] = [];
    
    console.log(`📊 총 ${totalPages}개 페이지 크롤링 필요`);
    
    // 배치 처리 (3개씩 병렬 처리)
    const batchSize = 3;
    for (let i = 0; i < totalPages; i += batchSize) {
      const promises = [];
      
      for (let j = 0; j < batchSize && i + j < totalPages; j++) {
        const page = i + j + 1;
        promises.push(fetchSinglePage(page, perPage));
      }
      
      const batchResults = await Promise.all(promises);
      
      // 결과 합치기
      batchResults.forEach(pageResults => {
        allResults.push(...pageResults);
      });
      
      console.log(`📈 진행률: ${allResults.length}/${targetCount}개 수집`);
      
      // API 부하 방지를 위한 짧은 대기
      if (i + batchSize < totalPages) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // 목표 개수에 도달하면 중단
      if (allResults.length >= targetCount) {
        break;
      }
    }
    
    // 중복 제거 및 정렬
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.round, item])).values()
    ).sort((a, b) => b.round - a.round);
    
    console.log(`✅ Lottolyzer 전체 크롤링 완료: ${uniqueResults.length}개`);
    return uniqueResults.slice(0, targetCount);
    
  } catch (error) {
    console.error('❌ Lottolyzer 전체 크롤링 실패:', error);
    return [];
  }
}

// 기존 함수 (단일 페이지용으로 유지)
export async function fetchBulkFromLottolyzer(count: number, offset: number = 0): Promise<LottolyzerResult[]> {
  // 단일 페이지 요청 (최대 50개)
  const page = Math.floor(offset / 50) + 1;
  return fetchSinglePage(page, Math.min(count, 50));
}
