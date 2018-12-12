import createApp from './main.ts'

export default context => {
  return new Promise((resolve, reject) => {
    let {
      app,
      router,
      store
    } = createApp()

    router.replace(context.url)
    router.onReady(() => {

      const matchedComponents = router.getMatchedComponents()
      if (!matchedComponents.length) return reject({
        code: 404
      })

      Promise.all(matchedComponents.map(Component => {
        console.log(context.url, router.currentRoute.name, )

        if (Component.asyncData) {
          return Component.asyncData({
            store,
            route: router.currentRoute,
            baseURL: context.origin
          })
        }
      })).then(() => {
        context.state = store.state
        resolve(app)

      }).catch(reject)
    }, reject)
    router.onError(reject)
  })
}
