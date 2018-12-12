workbox.core.setCacheNameDetails({
  prefix: 'jacelynfish-blog',
  suffix: 'v1.0.0',
});

workbox.skipWaiting();
workbox.clientsClaim();

workbox.precaching.precacheAndRoute(
  self.__precacheManifest || [], {
    ignoreUrlParametersMatching: [/.*/],
    cleanUrls: false,
  })

workbox.routing.registerRoute(
  /\/api\/posts$/,
  workbox.strategies.staleWhileRevalidate()
)

workbox.routing.registerRoute(
  /\/api\/posts\/detail/,
  workbox.strategies.cacheFirst({
    cacheName: 'post-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 24 * 60 * 60,
      }),
      new workbox.backgroundSync.Plugin('postDetail', {
        maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
      })
    ]
  })
)

workbox.routing.registerRoute(
  /^https:\/\/(?:.*)\.jacelyn\.fish/,
  workbox.strategies.networkFirst({
    fetchOptions: {
      credentials: 'include',
    },
  })
)

// Cache the Google Fonts stylesheets with a stale while revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'font-cache',
  }),
);

// Cache the Google Fonts webfont files with a cache first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  workbox.strategies.cacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);

workbox.routing.registerRoute(
  /.*(?:codepen\.io|disqus\.com)/,
  workbox.strategies.staleWhileRevalidate(),
);

workbox.routing.registerRoute(
  /.*\.(?:png|jpg|jpeg|svg|gif|css)/g,
  workbox.strategies.cacheFirst({
    cacheName: 'resources-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ]
  })
);
