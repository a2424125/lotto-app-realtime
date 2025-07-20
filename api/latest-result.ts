import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from 'axios';
import { 
  calculateCurrentRound,
  isInWaitingPeriod 
} from "../src/services/unifiedLottoService";

// 서버 사이드용 동행복권 API 직접 호출
async function fetchOfficialDataServer(round: number) {
  try {
    const { data } = await axios.get(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`,
      {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9'
        }
      }
    );
    
    if (data.returnValue === 'success') {
      return {
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
    }
    
    return null;
  } catch (error) {
    console.error(`❌ ${round}회차 서버 API 에러:`, error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 추가
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=60"); // 1분 캐시

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    console.log("📡 최신 당첨 결과 API 호출...");
    
    // 추첨 대기 시간 확인
    if (isInWaitingPeriod()) {
      console.log("⏳ 추첨 직후 대기 시간입니다");
      
      return res.status(200).json({
        success: true,
        isWaitingPeriod: true,
        message: "추첨 결과 집계중입니다. 잠시 후 다시 확인해주세요.",
        data: null
      });
    }
    
    // 현재 회차 계산
    const currentRound = calculateCurrentRound();
    console.log(`📊 현재 회차: ${currentRound}회차`);
    
    // 서버에서 직접 동행복권 API 호출
    const result = await fetchOfficialDataServer(currentRound);
    
    if (!result) {
      // 이전 회차 시도
      console.log("⚠️ 현재 회차 데이터 없음, 이전 회차 시도...");
      const previousResult = await fetchOfficialDataServer(currentRound - 1);
      
      if (previousResult) {
        return res.status(200).json({
          success: true,
          isWaitingPeriod: false,
          data: {
            ...previousResult,
            crawledAt: new Date().toISOString(),
            source: "dhlottery.co.kr"
          }
        });
      }
      
      return res.status(200).json({
        success: false,
        error: "데이터를 가져올 수 없습니다",
        data: null
      });
    }
    
    console.log(`✅ 최신 당첨 결과 반환: ${result.round}회차`);
    
    res.status(200).json({
      success: true,
      isWaitingPeriod: false,
      data: {
        ...result,
        crawledAt: new Date().toISOString(),
        source: "dhlottery.co.kr"
      }
    });
    
  } catch (error) {
    console.error("❌ 최신 결과 API 오류:", error);
    
    res.status(500).json({ 
      success: false,
      error: "서버 오류가 발생했습니다",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
