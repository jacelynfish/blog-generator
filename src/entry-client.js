import createApp from './main.ts'
import {
  BLOG_META
} from './utils/constants'

const {
  app,
  router,
  store
} = createApp()

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

window.urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribePush(reg) {
  let {
    uid
  } = store.getters['push/pushInfo']

  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: window.urlBase64ToUint8Array(window.PUBKEY)
    })
  }
  store.dispatch('push/SAVE_WEBPUSH_SUB', {
    subscription
  })
}


if ('serviceWorker' in navigator) {
  window.addEventListener('load', function (e) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('Successfully register service worker!')
        return subscribePush(reg)
      })
      .catch(err => {
        console.warn(err)
      })
  })
  navigator.serviceWorker.addEventListener('message', e => {
    let {
      type
    } = e.data
    if (type == 'POST_FORCE_RELOAD') {
      let current = router.currentRoute
      let params = current.params
      if (current.name == 'offline' &&
        e.data.paths.indexOf(params.title) != -1)
        router.push({
          path: params.failUrl
        })
    }
  })
}

router.onReady(() => {
  router.beforeEach((to, from, next) => {
    let title;
    if (to.meta.title) {
      title = typeof to.meta.title == 'function' ?
        to.meta.title(to) : to.meta.title
    } else {
      title = BLOG_META.name
    }
    document.title = title
    next()
  })
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)

    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })

    if (!activated.length) {
      return next()
    }

    Promise.all(activated.map(Component => {
        if (Component.asyncData)
          return Component.asyncData({
            store,
            route: to,
            baseURL: location.origin
          })
      })).then(() => next())
      .catch((err) => next({
        name: 'offline',
        params: {
          ...to.params,
          failUrl: to.path,
        }
      }))
  })
  app.$mount('#app', true)
})
