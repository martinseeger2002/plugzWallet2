// service-worker.js

const CACHE_NAME = 'plugz-wallet-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/wallet',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/images/icon-192x192.png',
  '/static/images/icon-512x512.png',
  '/static/favicon.ico',
  'https://unpkg.com/swiper/swiper-bundle.min.css',
  'https://unpkg.com/swiper/swiper-bundle.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful network requests
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        // Return offline fallback if both cache and network fail
        return new Response('Offline content here', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Handle push notifications if needed
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/static/images/icon-192x192.png',
    badge: '/static/images/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification('Plugz Wallet', options)
  );
});

