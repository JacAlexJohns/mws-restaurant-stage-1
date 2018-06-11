const version = 'v5';
const rCacheName = `restaurants-${version}`;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(rCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/css/responsive.css',
        '/css/styles.css',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          console.log(rCacheName);
          return cacheName.startsWith('restaurants-') &&
                 cacheName != rCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('https://maps.googleapi.com/js') == 0) {
    event.respondWith(caches.match('/img/'));
  }
  event.respondWith(
    caches.open(rCacheName)
      .then(cache => cache.match(event.request, {ignoreSearch: true}))
      .then(response => {
      return response || fetch(event.request);
    })
  );
});
