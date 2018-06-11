const version = 'v1';
const rCacheName = `restaurants-${version}`;
const iCacheName = `restaurants-images-${version}`;
const allCaches = [
  rCacheName, iCacheName
];

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
          return cacheName.startsWith('restaurants-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }
  event.respondWith(
    caches.open(rCacheName)
      .then(cache => cache.match(event.request, {ignoreSearch: true}))
      .then(response => {
      return response || fetch(event.request);
    })
  );
});

servePhoto = (request) => {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
  return caches.open(iCacheName).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;
      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
