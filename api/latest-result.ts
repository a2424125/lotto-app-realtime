import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as cheerio from "cheerio";

interface LottoResult {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

// 🆕 개선된 최신 회차 번호 추출
const fetchLatestRoundNumber = async (): Promise<number> => {
  try {
    // summary-view 페이지에서 최신 회차 추출
    const historyUrl = "https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto/page/1/per-page/50/summary-view";
    const { data: html } = await axios.get(historyUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(html);
    
    // 테이블의 첫 번째 행에서 회차 번호 추출
    const firstRowRoundText = $("table tbody tr").first().find("td").eq(0).text().trim();
    const round = parseInt(firstRowRoundText);

    if (isNaN(round)) {
      console.log("⚠️ summary-view에서 회차 추출 실패, 대체 방법 시도...");
      
      // 대체 방법: number-view 페이지 시도
      const numberViewUrl = "https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto";
      const { data: altHtml } = await axios.get(numberViewUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $alt = cheerio.load(altHtml);
      const altRoundText = $alt("table tbody tr").first().find("td").eq(0).text().trim();
      const altRound = parseInt(altRoundText);
      
      if (!isNaN(altRound)) {
        console.log(`✅ 대체 방법으로 최신 회차 발견: ${altRound}회차`);
        return altRound;
      }
      
      throw new Error("모든 방법으로 회차 추출 실패");
    }

    console.log(`✅ 최신 회차 발견: ${round}회차`);
    return round;
  } catch (error) {
    console.error("❌ 최신 회차 추출 실패:", error);
    
    // 현재 날짜 기준 추정 회차 계산
    const startDate = new Date('2002-12-07'); // 로또 시작일
    const currentDate = new Date();
    const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const estimatedRound = Math.max(1179, weeksSinceStart);
    
    console.log(`📊 추정 회차 사용: ${estimatedRound}회차`);
    return estimatedRound;
  }
};

// 🆕 개선된 로또 추첨 결과 추출
const fetchLottoDraw = async (round: number): Promise<LottoResult | null> => {
  try {
    console.log(`🔍 ${round}회차 상세 정보 추출 시도...`);
    
    // 1. number-view 페이지 시도
    const url = `https://en.lottolyzer.com/home/south-korea/6_slash_45-lotto/number-view/draw/${round}`;
    
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(html);

    // 로또 볼에서 번호 추출
    const numberImgs = $(".lotto-balls img, .lotto-ball img, .ball img");
    const numbers: number[] = [];

    numberImgs.each((i, el) => {
      const alt = $(el).attr("alt");
      const src = $(el).attr("src");
      
      // alt 속성에서 번호 추출
      if (alt && !isNaN(Number(alt))) {
        numbers.push(Number(alt));
      } 
      // src 속성에서 번호 추출 (예: ball-05.png)
      else if (src) {
        const srcMatch = src.match(/ball[_-]?(\d+)/i);
        if (srcMatch) {
          numbers.push(Number(srcMatch[1]));
        }
      }
    });

    // 번호가 부족한 경우 텍스트에서 추출 시도
    if (numbers.length < 7) {
      console.log("⚠️ 이미지에서 번호 부족, 텍스트 추출 시도...");
      
      const numberTexts = $(".lotto-number, .number, .winning-number").text();
      const textNumbers = numberTexts.match(/\d{1,2}/g);
      
      if (textNumbers) {
        textNumbers.forEach(numStr => {
          const num = parseInt(numStr);
          if (num >= 1 && num <= 45 && !numbers.includes(num)) {
            numbers.push(num);
          }
        });
      }
    }

    if (numbers.length < 7) {
      console.log("⚠️ number-view 실패, summary-view에서 재시도...");
      return await fetchFromSummaryView(round);
    }

    const mainNumbers = numbers.slice(0, 6).sort((a, b) => a - b);
    const bonus = numbers[6];

    // 날짜 추출
    const dateText = $(".lotto-number-info, .draw-date, .date")
      .text()
      .match(/(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})/);
    
    let date = "";
    if (dateText) {
      const parsedDate = new Date(dateText[1].replace(/\./g, "-"));
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString().split('T')[0];
      }
    }
    
    if (!date) {
      // 현재 날짜 기준 추정
      const currentDate = new Date();
      const estimatedDate = new Date(currentDate);
      estimatedDate.setDate(currentDate.getDate() - ((currentDate.getDay() + 1) % 7)); // 지난 토요일
      date = estimatedDate.toISOString().split('T')[0];
    }

    const result = {
      round,
      date,
      numbers: mainNumbers,
      bonus,
    };
    
    console.log(`✅ ${round}회차 추출 완료: [${mainNumbers.join(', ')}] + ${bonus} (${date})`);
    return result;

  } catch (error) {
    console.error(`❌ ${round}회차 추출 실패:`, error);
    return await fetchFromSummaryView(round);
  }
};

// 🆕 summary-view에서 특정 회차 추출
const fetchFromSummaryView = async (round: number): Promise<LottoResult | null> => {
  try {
    console.log(`🔄 summary-view에서 ${round}회차 재시도...`);
    
    const summaryUrl = "https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto/page/1/per-page/50/summary-view";
    const { data: html } = await axios.get(summaryUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(html);
    
    // 해당 회차 행 찾기
    let targetRow: cheerio.Cheerio<cheerio.Element> | null = null;
    
    $("table tbody tr").each((i, row) => {
      const roundText = $(row).find("td").eq(0).text().trim();
      if (parseInt(roundText) === round) {
        targetRow = $(row);
        return false; // break
      }
    });
    
    if (!targetRow) {
      throw new Error(`${round}회차를 찾을 수 없음`);
    }
    
    const cells = targetRow.find("td");
    const numbers: number[] = [];
    let bonus = 0;
    
    // 각 셀에서 번호 추출
    cells.each((i, cell) => {
      if (i === 0) return; // 첫 번째는 회차
      if (i === 1) return; // 두 번째는 날짜
      
      const cellText = $(cell).text().trim();
      const num = parseInt(cellText);
      
      if (!isNaN(num) && num >= 1 && num <= 45) {
        if (numbers.length < 6) {
          numbers.push(num);
        } else if (bonus === 0) {
          bonus = num;
        }
      }
    });
    
    if (numbers.length !== 6 || bonus === 0) {
      throw new Error("번호 추출 실패");
    }
    
    // 날짜 추출
    const dateText = cells.eq(1).text().trim();
    let date = "";
    
    const dateMatch = dateText.match(/(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})/);
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1].replace(/\./g, "-"));
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString().split('T')[0];
      }
    }
    
    const result = {
      round,
      date,
      numbers: numbers.sort((a, b) => a - b),
      bonus,
    };
    
    console.log(`✅ summary-view에서 ${round}회차 추출 완료: [${result.numbers.join(', ')}] + ${bonus}`);
    return result;
    
  } catch (error) {
    console.error(`❌ summary-view에서 ${round}회차 추출 실패:`, error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("📡 최신 당첨 결과 API 호출...");
    
    const round = await fetchLatestRoundNumber();
    const result = await fetchLottoDraw(round);

    if (!result) {
      return res.status(500).json({ 
        success: false,
        error: "Failed to fetch lotto result" 
      });
    }

    console.log(`✅ 최신 당첨 결과 반환: ${result.round}회차`);
    
    res.status(200).json({
      success: true,
      data: {
        round: result.round,
        date: result.date,
        numbers: result.numbers,
        bonusNumber: result.bonus,
        crawledAt: new Date().toISOString(),
        source: "en.lottolyzer.com"
      }
    });
    
  } catch (error) {
    console.error("❌ 최신 결과 API 오류:", error);
    
    res.status(500).json({ 
      success: false,
      error: "An error occurred while fetching the result.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
