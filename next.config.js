/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 앱과 API 함수 모두 지원
  experimental: {
    // Vercel Functions 최적화
    serverComponentsExternalPackages: ["cheerio"],
  },

  // API 라우트 설정
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },

  // CORS 및 헤더 설정
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=60", // 5분 캐시
          },
        ],
      },
    ];
  },

  // 정적 파일 최적화
  async redirects() {
    return [
      {
        source: "/health",
        destination: "/api/health-check",
        permanent: false,
      },
    ];
  },

  // 환경 변수 설정
  env: {
    CUSTOM_API_BASE_URL: process.env.CUSTOM_API_BASE_URL || "",
    CRAWLER_TIMEOUT: process.env.CRAWLER_TIMEOUT || "30000",
    MAX_ROUNDS_PER_REQUEST: process.env.MAX_ROUNDS_PER_REQUEST || "500",
    CACHE_DURATION: process.env.CACHE_DURATION || "300000", // 5분
  },

  // 번들 최적화
  webpack: (config, { isServer }) => {
    // Cheerio 최적화 (서버사이드에서만)
    if (isServer) {
      config.externals.push("cheerio");
    }

    // 클라이언트 번들 크기 최적화
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },

  // 이미지 최적화 설정
  images: {
    domains: ["en.lottolyzer.com", "lottolyzer.com"],
    unoptimized: true, // 정적 export를 위해
  },

  // 출력 설정 (Vercel 배포용)
  output: "standalone",

  // 빌드 최적화
  swcMinify: true,
  compress: true,

  // 개발 모드 설정
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: "bottom-right",
  },

  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 트레일링 슬래시 설정
  trailingSlash: false,

  // 페이지 확장자 설정
  pageExtensions: ["ts", "tsx", "js", "jsx"],

  // 실험적 기능들
  experimental: {
    // 서버 컴포넌트 관련
    serverComponentsExternalPackages: ["cheerio"],
    // 최적화된 패키지 로딩
    optimizePackageImports: ["cheerio", "axios"],
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://en.lottolyzer.com https://lottolyzer.com;",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=60",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
