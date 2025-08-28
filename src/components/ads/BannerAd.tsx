import React, { useEffect, useRef } from 'react';

interface BannerAdProps {
  slot: string;
  style?: React.CSSProperties;
  format?: string;
  responsive?: boolean;
  theme?: "light" | "dark";
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const BannerAd: React.FC<BannerAdProps> = ({ 
  slot, 
  style = {}, 
  format = 'auto',
  responsive = true,
  theme = "light"
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    try {
      // 광고가 이미 로드되었으면 스킵
      if (adLoadedRef.current) return;

      // adsbygoogle가 준비될 때까지 대기
      const loadAd = () => {
        if (window.adsbygoogle && adRef.current) {
          // 광고 요소가 비어있을 때만 로드
          if (adRef.current.children.length === 0) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            adLoadedRef.current = true;
          }
        }
      };

      // 스크립트가 로드된 후 광고 로드
      if (document.readyState === 'complete') {
        setTimeout(loadAd, 100);
      } else {
        window.addEventListener('load', () => {
          setTimeout(loadAd, 100);
        });
      }
    } catch (err) {
      console.error('광고 로드 에러:', err);
    }
  }, []);

  const colors = {
    light: {
      background: "#ffffff",
      border: "#e5e7eb",
    },
    dark: {
      background: "#1e293b",
      border: "#334155",
    },
  };

  const currentColors = colors[theme];

  return (
    <div 
      ref={adRef}
      style={{
        width: '100%',
        minHeight: '60px',
        backgroundColor: currentColors.background,
        borderTop: `1px solid ${currentColors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '60px' }}
        data-ad-client="ca-app-pub-1789035686079773"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

export default BannerAd;
