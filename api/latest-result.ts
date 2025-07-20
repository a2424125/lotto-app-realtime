import { VercelRequest, VercelResponse } from "@vercel/node";
import { 
  fetchOfficialLottoData, 
  calculateCurrentRound,
  isInWaitingPeriod 
} from "../src/services/unifiedLottoService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 추가
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
    
    // 동행복권 API에서 데이터 가져오기
    const result = await fetchOfficialLottoData(currentRound);
    
    if (!result) {
      // 이전 회차 시도
      console.log("⚠️ 현재 회차 데이터 없음, 이전 회차 시도...");
      const previousResult = await fetchOfficialLottoData(currentRound - 1);
      
      if (previousResult) {
        return res.status(200).json({
          success: true,
          isWaitingPeriod: false,
          data: {
            round: previousResult.round,
            date: previousResult.date,
            numbers: previousResult.numbers,
            bonusNumber: previousResult.bonusNumber,
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
        round: result.round,
        date: result.date,
        numbers: result.numbers,
        bonusNumber: result.bonusNumber,
        firstWinAmount: result.firstWinAmount,
        firstWinCount: result.firstWinCount,
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
