import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { drwNo } = req.query;
    
    if (!drwNo) {
      return res.status(400).json({
        success: false,
        message: "회차 번호(drwNo)가 필요합니다"
      });
    }
    
    console.log(`🎰 동행복권 프록시: ${drwNo}회차 요청`);
    
    const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
    
    // 서버 사이드에서 API 호출
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    console.log(`✅ 동행복권 프록시: ${drwNo}회차 성공`);
    
    // JSON 응답 반환
    res.status(200).json(data);
    
  } catch (error) {
    console.error("❌ 동행복권 프록시 에러:", error);
    
    res.status(500).json({
      success: false,
      message: "프록시 서버 오류",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
