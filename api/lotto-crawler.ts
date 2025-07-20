import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllLottoData } from "../src/services/hybridDataService";
import { isInWaitingPeriod, calculateCurrentRound } from "../src/services/unifiedLottoService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("🎰 로또 전체 데이터 크롤러 API 호출...");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1시간 캐시

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const startTime = Date.now();

  try {
    // 추첨 대기 시간 확인
    if (isInWaitingPeriod()) {
      console.log("⏳ 추첨 직후 대기 시간입니다");
      
      return res.status(200).json({
        success: false,
        data: [],
        message: "추첨 결과 집계중입니다. 잠시 후 다시 확인해주세요.",
        isWaitingPeriod: true
      });
    }

    // 하이브리드 방식으로 전체 데이터 가져오기
    const allData = await fetchAllLottoData();
    
    // rounds 파라미터 처리
    const roundsParam = req.query.rounds as string;
    let requestedRounds: number;
    let responseData = allData;
    
    // 🔥 수정된 부분: rounds 파라미터 처리
    if (!roundsParam || roundsParam === 'all') {
      // rounds 파라미터가 없거나 'all'이면 전체 데이터 반환
      requestedRounds = allData.length;
      console.log(`📊 전체 ${allData.length}개 데이터 반환`);
    } else {
      // 숫자가 지정되면 최신 회차부터 해당 개수만 반환
      requestedRounds = parseInt(roundsParam, 10);
      if (isNaN(requestedRounds) || requestedRounds <= 0) {
        requestedRounds = allData.length; // 잘못된 값이면 전체 반환
      } else {
        // 최신 회차부터 요청한 개수만큼 반환
        responseData = allData.slice(-requestedRounds).reverse();
        console.log(`📊 최신 ${requestedRounds}개 데이터만 반환`);
      }
    }
    
    const responseTime = Date.now() - startTime;
    const currentRound = calculateCurrentRound();

    console.log(`✅ 데이터 반환: ${responseData.length}개 회차 (${responseTime}ms)`);

    res.status(200).json({
      success: true,
      data: responseData.map(item => ({
        round: item.round,
        date: item.date,
        numbers: item.numbers,
        bonusNumber: item.bonusNumber,
        crawledAt: new Date().toISOString(),
        source: item.source
      })),
      message: `${responseData.length}개 회차 데이터 제공`,
      crawledAt: new Date().toISOString(),
      totalCount: responseData.length,
      metadata: {
        responseTime: responseTime,
        totalAvailable: allData.length,
        requestedRounds: requestedRounds,
        actualRounds: responseData.length,
        currentRound: currentRound,
        apiVersion: "9.0.0-hybrid",
        dataSources: {
          official: responseData.filter(d => d.source === 'official').length,
          lottolyzer: responseData.filter(d => d.source === 'lottolyzer').length
        },
        dataInfo: {
          latestRound: responseData.length > 0 ? responseData[responseData.length - 1].round : 0,
          oldestRound: responseData.length > 0 ? responseData[0].round : 0,
          coverage: `${responseData.length > 0 ? responseData[0].round : 1}회 ~ ${currentRound}회`
        }
      }
    });

  } catch (error) {
    console.error("❌ 크롤링 프로세스 실패:", error);

    res.status(500).json({
      success: false,
      data: [],
      message: "서버 오류가 발생했습니다",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
