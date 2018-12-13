import createApp from './main.ts';

export default context => {
  return new Promise((resolve, reject) => {
    let {
      app,
      router,
      store
    } = createApp();

    router.push({
      path: context.url
    }, undefined, abort => {
      console.log(context.url, 'abort');
    });
    let rej = (code, i) => () => {
      return reject({
        code
      });
    };

    // console.log(router.history);
    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents();
      if (!matchedComponents.length) return rej(404, 1)();

      return Promise.all(
          matchedComponents.map(Component => {
            console.log(context.url, router.currentRoute.name);

            if (Component.asyncData) {
              return Component.asyncData({
                store,
                route: router.currentRoute,
                baseURL: context.origin
              });
            }
          })
        )
        .then(() => {
          context.state = store.state;
          resolve(app);
        })
        .catch(rej(500, 2));
    }, rej(500, 3));
    router.onError(rej(500, 4));
  });
};
