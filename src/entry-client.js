import createApp from './main.ts'

const {
  app,
  router,
  store
} = createApp()

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function (e) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('Successfully register service worker!')
      })
      .catch(err => {
        console.warn(err)
      })
  })
}

router.onReady(() => {
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
          baseURL: process.env.NODE_ENV == 'development' ?
            'http://localhost:3007' : location.origin
        })
    })).then(() => next()).catch(next)
  })
  app.$mount('#app', true)
})
