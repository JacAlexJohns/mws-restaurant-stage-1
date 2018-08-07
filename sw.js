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
        '/js/jquery.js',
        '/js/jquery.lazyloadxt.js',
        'dist/css/all.css',
        'dist/small.js',
        'dist/img/1.jpg',
        'dist/img/2.jpg',
        'dist/img/3.jpg',
        'dist/img/4.jpg',
        'dist/img/5.jpg',
        'dist/img/6.jpg',
        'dist/img/7.jpg',
        'dist/img/8.jpg',
        'dist/img/9.jpg',
        'dist/img/10.jpg',
        'dist/img/icon.png',
        'dist/img/icon-512.png',
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
  if (event.request.url.indexOf('https://maps.googleapi.com/js') == 0) {
    event.respondWith(serveMap(event.request));
    return;
  }
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

serveMap = (request) => {
  return caches.open(rCacheName).then(function(cache) {
    return cache.match(request.url).then(function(response) {
      if (response) return response;
      return fetch(request).then(function(networkResponse) {
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

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
