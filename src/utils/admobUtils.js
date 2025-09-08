// AdMob 유틸리티 - Android 네이티브와 통신
class AdMobManager {
    constructor() {
        this.isAndroid = this.checkAndroidEnvironment();
        this.callbacks = {};
        this.initializeEventHandler();
    }

    // Android 환경 체크
    checkAndroidEnvironment() {
        return typeof window.AndroidAdMob !== 'undefined';
    }

    // 이벤트 핸들러 초기화
    initializeEventHandler() {
        // Android에서 보내는 이벤트 처리
        window.handleAdMobEvent = (eventData) => {
            console.log('AdMob Event:', eventData);
            
            if (eventData.event && this.callbacks[eventData.event]) {
                this.callbacks[eventData.event](eventData.data);
            }
        };
    }

    // 이벤트 리스너 등록
    on(eventName, callback) {
        this.callbacks[eventName] = callback;
    }

    // 이벤트 리스너 제거
    off(eventName) {
        delete this.callbacks[eventName];
    }

    // 전면광고 표시
    async showInterstitialAd() {
        return new Promise((resolve, reject) => {
            if (!this.isAndroid) {
                console.log('웹 환경: 전면광고 시뮬레이션');
                setTimeout(() => resolve('web_simulation'), 1000);
                return;
            }

            try {
                // 광고 닫힘 이벤트 리스너 설정
                this.on('onInterstitialClosed', () => {
                    this.off('onInterstitialClosed');
                    this.off('onInterstitialFailed');
                    resolve('closed');
                });

                // 광고 실패 이벤트 리스너 설정
                this.on('onInterstitialFailed', (error) => {
                    this.off('onInterstitialClosed');
                    this.off('onInterstitialFailed');
                    reject(new Error(error));
                });

                // Android 네이티브 메서드 호출
                window.AndroidAdMob.showInterstitialAd();
            } catch (error) {
                reject(error);
            }
        });
    }

    // 보상형 광고 표시
    async showRewardedAd() {
        return new Promise((resolve, reject) => {
            if (!this.isAndroid) {
                console.log('웹 환경: 보상형광고 시뮬레이션');
                setTimeout(() => resolve({ earned: true, amount: 100 }), 1000);
                return;
            }

            try {
                let rewardEarned = false;

                // 보상 획득 이벤트
                this.on('onRewardEarned', (amount) => {
                    rewardEarned = true;
                    console.log('보상 획득:', amount);
                });

                // 광고 닫힘 이벤트
                this.on('onRewardedClosed', () => {
                    this.off('onRewardEarned');
                    this.off('onRewardedClosed');
                    this.off('onRewardedFailed');
                    
                    if (rewardEarned) {
                        resolve({ earned: true, amount: 100 });
                    } else {
                        resolve({ earned: false, amount: 0 });
                    }
                });

                // 광고 실패 이벤트
                this.on('onRewardedFailed', (error) => {
                    this.off('onRewardEarned');
                    this.off('onRewardedClosed');
                    this.off('onRewardedFailed');
                    reject(new Error(error));
                });

                // Android 네이티브 메서드 호출
                window.AndroidAdMob.showRewardedAd();
            } catch (error) {
                reject(error);
            }
        });
    }

    // 전면광고 준비 상태 확인
    isInterstitialReady() {
        if (!this.isAndroid) return true;
        
        try {
            return window.AndroidAdMob.isInterstitialReady();
        } catch (error) {
            console.error('광고 상태 확인 실패:', error);
            return false;
        }
    }

    // 보상형광고 준비 상태 확인
    isRewardedReady() {
        if (!this.isAndroid) return true;
        
        try {
            return window.AndroidAdMob.isRewardedReady();
        } catch (error) {
            console.error('광고 상태 확인 실패:', error);
            return false;
        }
    }

    // 디버그 정보 출력
    debug() {
        console.log('=== AdMob Debug Info ===');
        console.log('Android Environment:', this.isAndroid);
        console.log('AndroidAdMob Available:', typeof window.AndroidAdMob !== 'undefined');
        
        if (this.isAndroid && window.AndroidAdMob) {
            console.log('Interstitial Ready:', this.isInterstitialReady());
            console.log('Rewarded Ready:', this.isRewardedReady());
        }
    }
}

// 싱글톤 인스턴스 생성 및 export
const adMobManager = new AdMobManager();
export default adMobManager;
