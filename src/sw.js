workbox.setConfig({
  debug: false
});

workbox.core.setCacheNameDetails({
  prefix: 'jacelynfish-blog',
  suffix: 'v1.0.1',
});

workbox.skipWaiting();
workbox.clientsClaim();

const precacheController = new workbox.precaching.PrecacheController()
precacheController.addToCacheList(self.__precacheManifest || [])

const router = new workbox.routing.Router()
router.registerRoute(new workbox.routing.RegExpRoute(/\/api\/posts$/,
  workbox.strategies.staleWhileRevalidate()))
router.registerRoute(new workbox.routing.RegExpRoute(
  /\/api\/posts\/detail/,
  workbox.strategies.cacheFirst({
    cacheName: 'post-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 24 * 60 * 60,
      }),
      new workbox.backgroundSync.Plugin('postDetail', {
        callbacks: {
          queueDidReplay: async (requests) => {
            let clients = await self.clients.matchAll()
            clients.forEach(client => {
              let clientUrl = new URL(client.url);
              client.postMessage({
                type: 'POST_FORCE_RELOAD',
                paths: requests.map(req => {
                  let _t = req.request.url.split('/')
                  return _t[_t.length - 1]
                })
              })
            })
          }
        },
        maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
      })
    ]
  })
))
router.registerRoute(new workbox.routing.RegExpRoute(
  /^https:\/\/(?:.*)\.jacelyn\.fish/,
  workbox.strategies.networkFirst({
    fetchOptions: {
      credentials: 'include',
    },
  })
))
router.registerRoute(new workbox.routing.RegExpRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'font-cache',
  }),
))
router.registerRoute(new workbox.routing.RegExpRoute(
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
))
router.registerRoute(new workbox.routing.RegExpRoute(
  /.*(?:codepen\.io|disqus\.com)/,
  workbox.strategies.staleWhileRevalidate(),
))
router.registerRoute(new workbox.routing.RegExpRoute(
  /.*\.(?:png|jpg|jpeg|svg|gif|css)/g,
  workbox.strategies.cacheFirst({
    cacheName: 'resources-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ]
  })
))


self.addEventListener('install', (e) => {
  e.waitUntil(precacheController.install())
})

self.addEventListener('activate', e => {
  e.waitUntil(precacheController.activate())
})

self.addEventListener('fetch', e => {
  let resPromise = router.handleRequest(e)
  if (resPromise) {
    e.respondWith(resPromise.catch(async err => {
      console.log(err)
    }))
  }
})

self.addEventListener('push', e => {
  const {title, body, tag} =  e.data ? e.data.json(): {}
  self.registration.showNotification(title, {
    body, tag
  })
})
