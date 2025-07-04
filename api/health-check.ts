// ❤️ api/health-check.ts
// 크롤링 서비스 상태를 확인하는 헬스체크 API

import { VercelRequest, VercelResponse } from "@vercel/node";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    lottolyzer: {
      status: "up" | "down";
      responseTime?: number;
      lastCheck: string;
    };
    crawler: {
      status: "ready" | "busy" | "error";
      lastRun?: string;
    };
  };
  system: {
    memory: string;
    uptime: string;
    region: string;
  };
  version: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("❤️ 헬스체크 API 호출...");

  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const startTime = Date.now();

  try {
    // Lottolyzer.com 상태 확인
    console.log("🔍 Lottolyzer.com 연결 상태 확인...");

    let lottolyzerStatus: "up" | "down" = "down";
    let responseTime: number = 0;

    try {
      const checkStart = Date.now();
      
      // ✅ AbortController로 타임아웃 구현
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
      
      const response = await fetch(
        "https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto",
        {
          method: "HEAD", // 헤더만 요청 (빠른 체크)
          headers: {
            "User-Agent": "HealthCheck/1.0",
          },
          signal: controller.signal, // ✅ controller.signal 사용
        }
      );
      
      clearTimeout(timeoutId); // 타임아웃 클리어
      responseTime = Date.now() - checkStart;

      if (response.ok) {
        lottolyzerStatus = "up";
        console.log(`✅ Lottolyzer.com 정상 (${responseTime}ms)`);
      } else {
        console.log(`⚠️ Lottolyzer.com 응답 오류: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Lottolyzer.com 연결 실패:`, error);
      responseTime = Date.now() - startTime;
    }

    // 시스템 정보 수집
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    // 전체 상태 결정
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (lottolyzerStatus === "down") {
      overallStatus = "unhealthy";
    } else if (responseTime > 3000) {
      // 3초 이상이면 degraded
      overallStatus = "degraded";
    }

    const healthData: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        lottolyzer: {
          status: lottolyzerStatus,
          responseTime: responseTime,
          lastCheck: new Date().toISOString(),
        },
        crawler: {
          status: "ready",
          lastRun: undefined, // 실제 구현에서는 마지막 실행 시간 저장
        },
      },
      system: {
        memory: `${memoryMB}MB`,
        uptime: `${Math.round(process.uptime())}s`,
        region: process.env.VERCEL_REGION || "unknown",
      },
      version: "2.0.0",
    };

    // 상태에 따라 적절한 HTTP 코드 반환
    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
        ? 200
        : 503;

    res.status(statusCode).json(healthData);

    console.log(
      `💚 헬스체크 완료: ${overallStatus} (${Date.now() - startTime}ms)`
    );
  } catch (error) {
    console.error("❌ 헬스체크 오류:", error);

    const errorHealth: HealthStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        lottolyzer: {
          status: "down",
          lastCheck: new Date().toISOString(),
        },
        crawler: {
          status: "error",
        },
      },
      system: {
        memory: "unknown",
        uptime: `${Math.round(process.uptime())}s`,
        region: process.env.VERCEL_REGION || "unknown",
      },
      version: "2.0.0",
    };

    res.status(503).json(errorHealth);
  }
}
