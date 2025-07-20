import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=300"); // 5분 캐시

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
    
    // 서버 사이드에서 API 호출 - 타임아웃 늘림
    const { data } = await axios.get(url, {
      timeout: 25000, // 25초로 늘림
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.dhlottery.co.kr/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // 재시도 설정
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // 4xx도 성공으로 처리
      }
    });
    
    // 응답 검증
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    
    console.log(`✅ 동행복권 프록시: ${drwNo}회차 성공`);
    
    // JSON 응답 반환
    res.status(200).json(data);
    
  } catch (error) {
    console.error("❌ 동행복권 프록시 에러:", error);
    
    // 타임아웃인 경우 재시도 안내
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: "동행복권 서버 응답 시간 초과",
        error: "서버가 일시적으로 느립니다. 잠시 후 다시 시도해주세요."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "프록시 서버 오류",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
