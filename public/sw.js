// 서비스 워커 버전 및 캐시 이름
const CACHE_NAME = "lotto-app-v1.0.0";
const OFFLINE_URL = "/offline.html";

// 캐시할 리소스들
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  OFFLINE_URL,
];

// 서비스 워커 설치
self.addEventListener("install", (event) => {
  console.log("서비스 워커 설치 중...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("캐시 열기 성공");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("캐시 추가 실패:", error);
      })
  );

  // 새 서비스 워커 즉시 활성화
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener("activate", (event) => {
  console.log("서비스 워커 활성화 중...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 이전 버전 캐시 삭제
            if (cacheName !== CACHE_NAME) {
              console.log("이전 캐시 삭제:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 모든 탭에서 새 서비스 워커 제어
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기
self.addEventListener("fetch", (event) => {
  // 카메라 관련 요청은 캐시하지 않음
  if (
    event.request.url.includes("mediaDevices") ||
    event.request.url.includes("camera") ||
    event.request.url.includes("video")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 있으면 캐시된 버전 반환
      if (response) {
        return response;
      }

      // 네트워크 요청 시도
      return fetch(event.request)
        .then((response) => {
          // 유효한 응답이 아니면 그대로 반환
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // 응답을 복제하여 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 오프라인 페이지 반환
          if (event.request.destination === "document") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("백그라운드 동기화 실행");
    event.waitUntil(doBackgroundSync());
  }
});

// 푸시 알림 (광고 수익 관련)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "새로운 당첨번호가 발표되었습니다!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
    actions: [
      {
        action: "check",
        title: "당첨확인",
        icon: "/icons/check-icon.png",
      },
      {
        action: "close",
        title: "닫기",
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "로또번호추천", options)
  );
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "check") {
    event.waitUntil(clients.openWindow("/?action=check"));
  } else if (event.action !== "close") {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});

// 백그라운드 동기화 함수
async function doBackgroundSync() {
  try {
    // 새로운 당첨번호 확인 등의 작업
    console.log("백그라운드에서 데이터 동기화");
  } catch (error) {
    console.error("백그라운드 동기화 실패:", error);
  }
}

// 에러 처리
self.addEventListener("error", (event) => {
  console.error("서비스 워커 에러:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("처리되지 않은 Promise 거부:", event.reason);
});
