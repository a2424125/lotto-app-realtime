// src/components/AdComponents.tsx
// 이 파일을 src/components 폴더에 새로 만드세요

import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

// 전면 광고 컴포넌트 (1등 추천 시 사용)
export const InterstitialAd: React.FC<{
  onClose: () => void;
  onAdLoaded?: () => void;
}> = ({ onClose, onAdLoaded }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // AdSense 스크립트가 로드되었는지 확인
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
        setIsLoading(false);
        if (onAdLoaded) {
          onAdLoaded();
        }
      }
    } catch (err) {
      console.error('광고 로드 실패:', err);
      setIsLoading(false);
    }

    // 광고가 표시된 후 자동으로 닫기 (선택사항)
    const timer = setTimeout(() => {
      onClose();
    }, 30000); // 30초 후 자동 닫기

    return () => clearTimeout(timer);
  }, [onClose, onAdLoaded]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>광고 로딩 중...</p>
          </div>
        )}
        
        <ins 
          className="adsbygoogle"
          style={{ 
            display: isLoading ? 'none' : 'block',
            width: '320px',
            height: '480px',
          }}
          data-ad-client="ca-app-pub-1789035686079773"
          data-ad-slot="2283321824"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// 보상형 광고 컴포넌트 (미니게임에서 사용)
export const RewardedAd: React.FC<{
  onClose: () => void;
  onRewarded: () => void;
}> = ({ onClose, onRewarded }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [watchComplete, setWatchComplete] = useState(false);

  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
        setIsLoading(false);
      }
    } catch (err) {
      console.error('광고 로드 실패:', err);
      setIsLoading(false);
    }

    // 광고 시청 완료 시뮬레이션 (실제로는 AdSense 콜백 사용)
    const timer = setTimeout(() => {
      setWatchComplete(true);
      onRewarded();
    }, 5000); // 5초 후 보상

    return () => clearTimeout(timer);
  }, [onRewarded]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          position: 'relative',
        }}
      >
        <h3 style={{ marginTop: 0 }}>광고 시청하고 보상 받기</h3>
        
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>광고 로딩 중...</p>
          </div>
        )}
        
        <ins 
          className="adsbygoogle"
          style={{ 
            display: isLoading ? 'none' : 'block',
            width: '320px',
            height: '480px',
          }}
          data-ad-client="ca-app-pub-1789035686079773"
          data-ad-slot="1955441895"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {watchComplete && (
          <button
            onClick={onClose}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            보상 받기
          </button>
        )}
      </div>
    </div>
  );
};
