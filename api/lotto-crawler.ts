import { VercelRequest, VercelResponse } from "@vercel/node";
import { 
  fetchMultipleRounds, 
  calculateCurrentRound,
  isInWaitingPeriod,
  LottoResult 
} from "../src/services/unifiedLottoService";

interface LottoDrawResult {
  round: number;
  date: string;
  numbers: number[];
  bonusNumber: number;
  jackpotWinners?: number;
  jackpotPrize?: number;
  crawledAt?: string;
  source?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("🎰 로또 크롤러 API 호출...");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=300");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const startTime = Date.now();

  try {
    const roundsParam = req.query.rounds as string;
    const currentRound = calculateCurrentRound();
    const targetRounds = roundsParam ? parseInt(roundsParam, 10) : 100;
    
    console.log(`📊 ${targetRounds}회차 요청 처리 중 (현재 회차: ${currentRound})...`);

    // 추첨 대기 시간 확인
    if (isInWaitingPeriod()) {
      console.log("⏳ 추첨 직후 대기 시간입니다");
      
      return res.status(200).json({
        success: false,
        data: [],
        message: "추첨 결과 집계중입니다. 잠시 후 다시 확인해주세요.",
        isWaitingPeriod: true,
        crawledAt: new Date().toISOString(),
        source: "waiting_period",
        totalCount: 0,
        metadata: {
          responseTime: Date.now() - startTime,
          requestedRounds: targetRounds,
          actualRounds: 0,
          currentRound: currentRound,
          isWaitingPeriod: true
        }
      });
    }

    // 동행복권 API에서 여러 회차 데이터 가져오기
    console.log("🔄 동행복권 공식 API에서 데이터 가져오는 중...");
    const results = await fetchMultipleRounds(targetRounds);
    
    if (results.length === 0) {
      return res.status(200).json({
        success: false,
        data: [],
        message: "데이터를 가져올 수 없습니다",
        crawledAt: new Date().toISOString(),
        source: "error",
        totalCount: 0,
        metadata: {
          responseTime: Date.now() - startTime,
          requestedRounds: targetRounds,
          actualRounds: 0,
          currentRound: currentRound
        }
      });
    }

    // API 응답 형식에 맞게 변환
    const lottoData: LottoDrawResult[] = results.map(result => ({
      round: result.round,
      date: result.date,
      numbers: result.numbers,
      bonusNumber: result.bonusNumber,
      jackpotWinners: result.firstWinCount,
      jackpotPrize: result.firstWinAmount,
      crawledAt: new Date().toISOString(),
      source: "dhlottery.co.kr"
    }));

    const responseTime = Date.now() - startTime;
    const latestRound = lottoData.length > 0 ? lottoData[0].round : 0;
    const oldestRound = lottoData.length > 0 ? lottoData[lottoData.length - 1].round : 0;

    console.log(`✅ 크롤링 완료: ${lottoData.length}회차 (${latestRound}~${oldestRound}회차)`);

    res.status(200).json({
      success: true,
      data: lottoData,
      message: `${lottoData.length}회차 데이터 제공 (${latestRound}~${oldestRound}회차)`,
      crawledAt: new Date().toISOString(),
      source: "dhlottery.co.kr",
      totalCount: lottoData.length,
      metadata: {
        responseTime: responseTime,
        requestedRounds: targetRounds,
        actualRounds: lottoData.length,
        dataRange: `${latestRound}~${oldestRound}회차`,
        dataQuality: "official",
        lastValidated: new Date().toISOString(),
        apiVersion: "8.0.0-official",
        crawlingMethod: "official_api",
        currentRound: currentRound,
        coverage: `${Math.round((lottoData.length / currentRound) * 100)}%`
      }
    });

  } catch (error) {
    console.error("❌ 크롤링 프로세스 실패:", error);

    res.status(500).json({
      success: false,
      data: [],
      message: "서버 오류가 발생했습니다",
      error: error instanceof Error ? error.message : "Unknown error",
      crawledAt: new Date().toISOString(),
      source: "error",
      totalCount: 0,
      metadata: {
        responseTime: Date.now() - startTime,
        apiVersion: "8.0.0-official",
        currentRound: calculateCurrentRound()
      }
    });
  }
}
