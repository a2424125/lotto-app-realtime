import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LottolyzerResult {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
}

// Lottolyzer에서 대량 데이터 가져오기
export async function fetchBulkFromLottolyzer(count: number, offset: number = 0): Promise<LottolyzerResult[]> {
  try {
    console.log(`🔍 Lottolyzer에서 ${count}개 데이터 가져오기 (offset: ${offset})...`);
    
    const url = `https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto/page/1/per-page/${count}/summary-view`;
    
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(html);
    const results: LottolyzerResult[] = [];
    
    $("table tbody tr").each((i, row) => {
      if (i < offset) return; // offset 적용
      
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
    
    console.log(`✅ Lottolyzer에서 ${results.length}개 데이터 가져오기 완료`);
    return results;
    
  } catch (error) {
    console.error('❌ Lottolyzer 크롤링 실패:', error);
    return [];
  }
}
