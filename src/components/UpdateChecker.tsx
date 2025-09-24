import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  minVersion: string;
  versionCode: number;
  updateUrl: string;
  updateMessage: string;
  forceUpdate: boolean;
  updateDate: string;
  features: string[];
}

const UpdateChecker = () => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  
  // 현재 앱 버전 (이 값을 수정해야 합니다!)
  const CURRENT_VERSION = "4.2";  // 기존 앱 버전
  const CURRENT_VERSION_CODE = 29;  // 기존 앱 버전코드

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      // 캐시 방지를 위해 timestamp 추가
      const response = await fetch(`/version.json?t=${Date.now()}`);
      const data: VersionInfo = await response.json();
      
      // 버전코드로 비교
      if (CURRENT_VERSION_CODE < data.versionCode) {
        setVersionInfo(data);
        setShowUpdateDialog(true);
      }
    } catch (error) {
      console.error('버전 체크 실패:', error);
    }
  };

  const handleUpdate = () => {
    if (versionInfo?.updateUrl) {
      window.location.href = versionInfo.updateUrl;
    }
  };

  if (!showUpdateDialog || !versionInfo) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          color: '#333',
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          🎉 업데이트 알림
        </h2>
        
        <p style={{
          color: '#666',
          marginBottom: '20px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {versionInfo.updateMessage}
        </p>
        
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <p style={{
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#333'
          }}>
            새로운 기능:
          </p>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#666'
          }}>
            {versionInfo.features.map((feature, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <button 
          onClick={handleUpdate}
          style={{
            padding: '12px 40px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          지금 업데이트
        </button>
        
        {!versionInfo.forceUpdate && (
          <button 
            onClick={() => setShowUpdateDialog(false)}
            style={{
              marginTop: '10px',
              padding: '10px 30px',
              backgroundColor: 'transparent',
              color: '#999',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            나중에 하기
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdateChecker;
