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
    const { page = '1', perPage = '50' } = req.query;
    
    console.log(`🔄 Lottolyzer 프록시: ${page}페이지 요청`);
    
    const url = `https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto/page/${page}/per-page/${perPage}/summary-view`;
    
    // 서버 사이드에서 크롤링 수행
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`✅ Lottolyzer 프록시: ${page}페이지 성공`);
    
    // HTML 응답 반환
    res.status(200).send(data);
    
  } catch (error) {
    console.error("❌ Lottolyzer 프록시 에러:", error);
    
    res.status(500).json({
      success: false,
      message: "프록시 서버 오류",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
