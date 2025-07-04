
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["cheerio"],
    optimizePackageImports: ["cheerio", "axios"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
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
  async redirects() {
    return [
      {
        source: "/health",
        destination: "/api/health-check",
        permanent: false,
      },
    ];
  },
  env: {
    CUSTOM_API_BASE_URL: process.env.CUSTOM_API_BASE_URL || "",
    CRAWLER_TIMEOUT: process.env.CRAWLER_TIMEOUT || "30000",
    MAX_ROUNDS_PER_REQUEST: process.env.MAX_ROUNDS_PER_REQUEST || "1200",
    CACHE_DURATION: process.env.CACHE_DURATION || "300000",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("cheerio");
    }
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
  images: {
    domains: ["en.lottolyzer.com", "lottolyzer.com"],
    unoptimized: true,
  },
  output: "standalone",
  swcMinify: true,
  compress: true,
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: "bottom-right",
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  trailingSlash: false,
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

module.exports = nextConfig;
