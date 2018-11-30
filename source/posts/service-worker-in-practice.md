---
title: 博客大改造：Service Worker 实践与总结
date: 2018-11-02 17:09:17
tags:
  - service worker
  - pwa
  - optimization
categories:
  - JavaScript
---

回归博客一个多月，给自己最大的感受就是使用 GitHub Page 搭建的博客在国内没有梯子的情况下访问实在太慢了，在移动端的首屏加载有时甚至超过 10 秒钟，严重影响交互体验。刚好最近在学习 Service Worker，便决定以自己的博客作为小白鼠，实践离线访问、后台同步和 Preload & Prefetch 等渐进式单页应用的逆天功能吧~

<!-- more -->

## Service Worker 缓存资源离线可用

Service Worker 本质上是一种特殊的 JavaScript Worker，它脱离主页面在一个单独的线程里后台运行，因此无法直接访问 DOM，而是需要通过 postMessage 消息通知接口与主页面线程进行数据交互；但也因其独立运行的特性，即使用户在关闭页面甚至浏览器后，Service Worker 依然可以在后台默默运行直到所有工作结束。Service Worker 是 PWA 技术的核心，它驱动着离线缓存、消息推送和后台同步等功能的发展，大大弥补了传统网页应用相比原生应用的缺陷，提升交互体验。可以将 Service Worker 看作一种**可编程的网络代理**(programmable network proxy)，允许开发者“劫持”页面上所有的请求，并动态决定返回何种资源。

那么我们是如何使用 Service Worker 使得站点的资源支持离线访问的呢？这主要得益于三个重要的生命周期中不同的资源缓存管理策略：

- **`install`**：Service Worker 注册并安装完成后，请求页面关键资源并缓存；
- **`activate`**：激活后删除过期缓存
- **`fetch`**：页面受控后所有请求会被 Service Worker “劫持”，根据资源类型动态返回缓存数据或请求新数据

> 网络上关于 Service Worker 及其生命周期的概念已经有很完整的介绍了，大家可以参考一下[这篇教程](https://developers.google.com/web/fundamentals/primers/service-workers)，因为本文主要是经验总结，概念介绍就不过多描述了。

### install

在 Service Worker 注册并安装完成后，`install` 事件被触发。在这个回调处理里，我们定义了一系列对站点离线访问最关键的资源 URL 列表，它们通常也是关键请求链包含的文件，并将其缓存进 `caches` 中。

```javascript
self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache =>
        cache.addAll([
          ...fileList.main,
          ...fileList.vendor,
          '/js/src/utils.js?v=6.4.2',
          '/js/src/motion.js?v=6.4.2',
          '/js/src/bootstrap.js?v=6.4.2'
        ])
      )
      .then(self.skipWaiting())
      .catch(err => console.log(err))
  );
});
```

这里需要注意的是，这个缓存过程是返回一个 `Promise` 对象，我们将其传入 `e.waitUntil()` 方法中，以便让 Service Worker 至少会运行到处理完成这个过程才关闭，以及安装过程是否成功。当任何一个文件无法下载，`Promise` 对象抛错，Service Worker 便会安装失败，浏览器会抛弃当前 Service Worker。

每个 Service Worker 只会触发一次 `install` 事件，当 Service Worker 文件本身发生任何修改，浏览器都会认为它是新的 Worker 对象并重新触发安装。在安装的过程中，旧的 Service Worker 依然继续控制着当前页面，此时新 Worker 便会进入 `waiting` 状态，只有当页面关闭后旧 Worker 才会被清除，新 Service Worker 进入 `activate` 状态。然而在博客页面里我希望修改完的 Service Worker 文件立刻生效，于是可以使用 `self.skipWaiting()` 略过等待阶段，直接使旧 Worker 使用，激活新 Worker。

### activate

`activate` 事件回调是一个管理老旧缓存的好地方，我们可以通过修改 `CACHE_NAME` 删除不需要的缓存。在一般 PWA 中，我们可以结合版本号和缓存名，及时删除过期缓存；但在本博客大多是静态资源，修改少，在接下来的开发中就一直使用相同的 `CACHE_NAME`。

```javascript
self.addEventListener('activate', e => {
  let whiteList = [CACHE_NAME];
  e.waitUntil(
    (async function() {
      let keys = await caches.keys();
      await Promise.all(
        keys.map(name => {
          if (whiteList.indexOf(name) === -1) return caches.delete(name);
        })
      );
      await self.clients.claim();
      await self.registration.navigationPreload.enable();
    })()
  );
});
```

然而一个 Service Worker 进入激活状态并不意味着注册它的页面就受控了。默认来说，出于一致性（consistency）考虑，如果一个页面本身的请求不是通过 Service Worker 加载的，它所发起的所有子资源请求也不会经过 Service Worker，如一个崭新的、没有 Service Worker 注册过的应用。使用 `clients.claim()` 可以重写这一默认行为，直接控制非受控的页面，而不用等待页面再次刷新。

### fetch

当我们把 `fetch`事件看做网络代理的话，就需要对不同资源类型应用不同的请求/缓存策略。这里应用的策略主要分三个分支

| 策略                           | 资源                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| cache, falling back to network | 几乎无修改的静态资源，如字体、图片和第三方库               |
| stale-while-revalidating       | 导航请求、常根据业务修改的样式和应用脚本                   |
| 正常 HTTP 请求                 | 第三方插件请求，如 codepen，discus，Google Analysis 等请求 |

由于第三方插件是网站的增强功能，即使请求失败也对页面本身访问影响不大，我们在这里不需要对其作任何处理、拦截，最简单的方法就是不将其 `e.request` 传入任何 `fetch` 请求中。然而对于其他关键资源，对应策略的主要区别在于缓存/网络请求的优先级：

#### Cache, falling back to network

![Cache, falling back to network](/images/service-worker-in-practice/cache-falling-back-to-network.png)

对于几乎无修改的静态资源，如字体、图片和第三方库，优先使用缓存，在无对应资源时再进行请求能有效地节省带宽资源，提高页面加载速度。

```javascript
e.respondWith(
  caches.match(e.request).then(function(_res) {
    return (
      _res || // 缓存无命中，再次发起网络请求
      fetched.then(fetchRes => {
        e.waitUntil(saveCache(e.request, fetchRes.clone()));
        return fetchRes;
      })
    );
  })
);
```

#### Stale-while-revalidating

![stale while revalidating](/images/service-worker-in-practice/stale-while-revalidate.png)
对于博客应用的关键请求资源，如导航请求、离线页面、CSS 和 JS，一昧使用缓存中的旧资源是不可取的（因为 Po 主本人会经常发癫这里那里改改样式嘻嘻(´･ω･`)，因此在 Stale-while-revalidating 策略里，我们使用`fetch`请求与缓存竞争，通过对比缓存和请求的`last-modified` 响应字段，一旦发现最新资源则需要更新缓存。

```javascript
e.respondWith(
  Promise.race([fetched.catch(_ => cached), useCached])
    .then(_res => _res || fetched)
    .catch(_ => {
      if (isNavigate) return caches.match('/offline/');
    })
);
// 判断最后修改时间，资源若有更新则替换缓存
e.waitUntil(
  Promise.all([fetchedCopy, caches.match(e.request)])
    .then(([_resp, _cresp]) => {
      let fModified = _resp.headers.get('last-modified');
      let cModified = _cresp && _cresp.headers.get('last-modified');
      if (isNavigate || !fModified || fModified != cModified)
        return saveCache(e.request, _resp);
    })
    .catch(_ => {})
);
```

由于在博客应用中，静态资源占比较大而更追求加载速度，也不存在表单交互、XHR 请求等功能，因此使用的请求策略对缓存依赖还是比较大。但在普通单页应用中，应该更倾向于网络优先的方法，以防止用户无法及时获取最新数据。[Google Developer 上的这篇文档](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook) 更详细地介绍了请求策略的一些最佳实践。

## Navigation Preload

在跳转到一个使用 Service Worker 处理 fetch 请求的页面时，如果该 Service Worker 没有在运行，则浏览器需要启动该 Worker，然而这会导致 navigation request 有一定的延迟无法立即执行，我们可以使用 Navigation Preload 机制来使浏览器并行处理 Service Worker 的启动和跳转请求。

<div style="width: 60%; min-width: 300px; display: flex; line-height: 2; margin: 0 auto;"><span style="color:white; background-color: #fcc255; padding: 0 6px; white-space: pre">SW bootup</span><span style="width: 100%; background-color: #57a2e4; color: white; padding: 0 6px;">Navigation Request</span></div><span style="width: 100%; text-align: center;display: inline-block; font-size: 12px; color: rgba(0,0,0,0.5); text-align: center; margin: 0; line-height: 2">Service Worker 启动阻塞请求的发送</span>

```javascript
self.addEventListener('activate', e => {
  e.waitUntil(
    (async function() {
      await self.registration.navigationPreload.enable();
    })()
  );
});
```

如果需要在 `fetch` 事件里使用 preload 的结果，则在 `activate` 事件里开启功能一般是 Navigation Preload 的最佳实践。

```javascript
self.addEventListener('fetch', e => {
  let isNavigate =
    e.request.mode == 'navigate' || e.request.destination == 'document';
  //...
  let fetched =
    isLocal && isNavigate
      ? e.preloadResponse.catch(_ => fetchClone)
      : fetchClone;
  //...
});
```

<div style="width: 60%; min-width: 300px; display: flex; flex-direction: column; line-height: 2; margin: 0 auto;"><span style="width: fit-content; color:white; background-color: #fcc255; padding: 0 6px; white-space: pre">SW bootup</span><span style="background-color: #57a2e4; color: white; padding: 0 6px;">Navigation Request</span></div><span style="width: 100%; text-align: center;display: inline-block; font-size: 12px; color: rgba(0,0,0,0.5); text-align: center; margin: 0; line-height: 2">使用 Navigation Preload 后，Service Worker 和请求并行进行</span>

`e.preloadResponse` 是一个 `Promise` 对象，当满足以下三个条件时便会 `resolve` 返回已请求好的资源：**1)** Navigation Preload 已开启，**2)** 请求方法是 'GET' 和 **3)** 该请求是由浏览器在加载页面时的*导航请求*(navigation request)，包括页面刷新、跳转和 `iframes` 里的页面请求；否则则会 `resolve` 为 `undefined`。需要注意的是，如果开启了 Navigation Preload 就请务必使用 `e.preloadResponse` 所返回的资源，否则使用 `fetch(e.request)` 再次加载则会造成双重请求，浪费带宽资源。

在实现过程中，首先检查请求对象的 `mode` 的值是否 `navigate` 确认使用 `e.preloadResponse` 或是正常的 `fetch` 请求，一旦 preload 抛错则使用 `fetch` 请求作为后备响应。因此如上一节，Navigation Preload  请求也是会跟缓存资源竞争比对，然而缓存的获取往往都会比请求返回效率更高，这就很容易造成即使导航页面有更新，而用户再次访问时 Service Worker 却直接从缓存中返回旧数据，导致实际页面与服务端**本想**提供的资源不一致。这明显是不可取的做法，现代 SPA 中导航请求页面往往是更多核心资源的入口，旧版本的页面意味着浏览器无法请求带有最新版本号的样式或脚本文件，我们需要对 Navigation Preload 请求作绕过缓存的处理：

```javascript
// in fetch handler
let useCached = new Promise((resolve, reject) => {
  if (isNavigate)
    //【Navigation Mode】请求与超时竞争
    setTimeout(() => {
      reject(); // 设置导航请求超时时间
    }, 5000);
  else resolve(cached); // 【Regular Request】请求与缓存竞争
});

e.respondWith(
  // 在 Navigate 模式下，在请求超时前（网络不顺畅）没有返回请求或缓存资源
  // 抛出错误，直接渲染 offline 页面
  Promise.race([fetched.catch(_ => cached), useCached])
    .then(_res => _res || fetched)
    .catch(_ => {
      if (isNavigate) return caches.match('/offline/');
    })
);
```

在普通模式下，使用 `fetch` 请求的资源与缓存比对；在 navigation request 模式下，请求与超时竞争，如果在请求超时前（离线或网络不顺畅）没有返回请求或缓存资源，则抛出 `reject` 错误，直接渲染已在缓存中就绪的离线页面，为用户提供 Background Sync 后台同步服务。

## Background Sync 后台同步

![Background Sync in action](/images/service-worker-in-practice/background_sync.gif){.shadowed}

在常见的网页应用上我们经常会遇到这样一个场景，假设我们在某 AO3 刷脆皮鸭：

1. 哇这篇 AU 文有点甜!?(･\_･;? 格兰芬多欧比旺大战伏地魔安纳金？我点爆！！
2. \*走进厕所辣鸡运营商信号只有半格【碳凝警告 (´･ω･`)
3. 进度条跑啊跑，最后 Chrome 留给本流泪猫猫头的只有一只灰色小恐龙 \_(´ཀ`」 ∠)\_

局限于传统浏览器的工作方法，当用户离开页面（关闭当前 tab、设备休眠）进行中的请求终止；或者当网络状况出错时，在新的请求失败后无法在网络恢复时重新自动发送。而 Background Sync 后台同步的横空出世提供了一种机制以改进这个体验极差的交互：借助 Service Worker 的 `sync` 事件，我们终于可以在一个行为，如网络请求失败时将其“保存”下来，等待合适时间再次操作。

我们来看一下，如何利用 Service Worker 的后台同步机制，在博客里改进网络不佳的交互体验：
![background sync flowchart](/images/service-worker-in-practice/bg_sync_flowchart.png)

### 在页面中注册 `sync` 事件

在上一节中,我们提到了当网络不加时，请求抛错的处理会返回已在缓存就绪的离线页面，模仿原生 APP 为用户提供一定的视觉提示网络出错，而不是直接显示浏览器默认的灰色错误页面。这个时机便是注册提示浏览器窗口注册新的 `sync` 事件的最好机会。

当离线页面加载后便注册新的 `sync` 事件。由于后台同步功能需要在 Service Worker 注册完成后才能触发，我们在 `navigator.serviceWorker.ready` 回调中使用 `registration.sync.register()` 触发后台同步，并传入参数 `sync_tag` 作为这个后台同步的唯一标识。`sync_tag` 由同样的前缀，结合每一篇文章本身独特的 id 组成，支持同时打开多个不同路由页面的情况下，当网络恢复时都可以同步刷新。

```javascript
// /swReg.js
let SYNC_TAG = 'my_sync_tag';
navigator.serviceWorker.ready.then(registration => {
  Promise.all([openStore(STORE_NAME), registration]).then(
    ([db, registration]) => {
      // 处理 indexdb transactions 与 Service Worker 同步数据
      // ...
      let titleMatch = /^\/(.+\/)*([^\/]+)\/?$/g.exec(location.pathname);
      let sync_tag = `${SYNC_TAG}-${titleMatch ? titleMatch[2] : 'home'}`;

      // 在离线页面里，在 navigator.serviceWorker.ready 后监听消息事件
      if (IS_OFFLINE) {
        registration.sync
          .register(sync_tag)
          .then(() => registration.sync.getTags())
          .catch(err => {
            console.error('error while registring background sync', SYNC_TAG);
          });
      }
    }
  );
});
```

这里要注意的是，每一个 `sync` 事件都应有一个**唯一**的 `tag` 作为标识。假如在前一个 `sync` 事件还未被处理完成时，就注册同一个标签的新的 `sync` 事件，两个事件会合并为同一个在 Service Worker 中进行处理。这也说明，如果我们注册的 `sync` 事件是幂等的（idempotent：多次同样的操作只会有相同的副作用和结果，例如使用 `GET` 进行请求），就可以使用相同的 `tag` 将他们合并为同一个事件；否则，在某些非幂等的场景下例如使用 `POST` 提交请求、聊天软件里离线发送多条不同的消息等，最好为每个 `sync` 事件都用不同的 `tag` 来注册。

### 在 Service Worker 中监听处理 `sync` 事件

在触发后台同步后，我们便需要在 Service Worker 中监听处理 `sync` 事件。在 `sync` 事件里，我们为熟悉的 `e.waitUntil()` 传入一个 `Promise` 对象来判断后台同步是否成功，确保就算用户离开当前页面，Service Worker 也会继续在浏览器后台运行，直到请求完成；如果 `Promise` 失败了，则浏览器会调度新一个 `sync` 事件进行重试，而在等待网络恢复的过程中，重试 `sync` 的时间间隔将会呈**指数性**增加。

```javascript
// /sw.js
self.addEventListener('sync', e => {
  if (e.tag == 'my_sync_tag') {
    e.waitUntil(
      getSyncURL().then(async ({ url }) => {
        let fetched = fetch(url);
        let res = await fetched;
        let clients = await self.clients.matchAll();
        clients.some(client => {
          let clientUrl = new URL(client.url);
          let isSyncClient = clientUrl.pathname + clientUrl.search == url;
          if (isSyncClient)
            client.postMessage({
              // 像 URL 与请求资源相同的 client 发送强制更新消息
              type: 'FORCE_RELOAD',
              url
            });
          return isSyncClient;
        });
        return saveCache(url, res);
      })
    );
  }
});
```

一旦请求顺利完成，我们再次使用 `client.postMessage()` 告知当前拥有同样 URL、并且显示离线页面的 client 强制刷新页面：

```javascript
// /swReg.js
navigator.serviceWorker.addEventListener('message', e => {
  let { type } = e.data;
  if (type == 'BG_SYNC_REQUIRE') {
    /* 注册 sync 事件*/
  } else if (type == 'FORCE_RELOAD') {
    // IS_OFFLINE 是离线页面上独有的全局标识
    if (IS_OFFLINE && e.data.url == location.pathname) location.reload();
  }
});
```

这样我们就可以实现即时在离线状态下，也能保存请求状态，以便网络恢复后第一时间再次请求，并将返回的资源存入缓存中啦~ 其实在这个过程中还牵涉到如何在后台同步触发过程中动态提供数据，如请求的 URL 地址，常用的实现方法有 `postMessage` 消息通知或使用浏览器本地储存功能。在博客改造的实践中，我使用了 indexedDB 实现全局的数据存储，数据交换思路如下：

1. 在页面里，Service Worker 已注册完后储存当前 URL 信息，
2. 当 `sync` 事件触发时，在回调函数中往数据库提取 URL 信息，
3. 请求该 URL。

IndexedDB 的强大功能不止于这小小的 CRUD，具体使用方式就不在这一节详细介绍啦，感兴趣的同学可以查看网页源码或者查询 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) 的 API 吧~

## Preload & Prefetch 资源预加载

与 Navigation Preload 不一样的是，Preload 意在提前指定请求隐藏在资源依赖树较深处的资源，加快请求关键链的就绪；而 Prefetch 则支持提前下载**最可能**被访问的资源，如非首屏或下一个路由的资源，当相关资源被访问时可直接从缓存中取出，大大降低最快可交互时间。

首先我们来看一下 Preload 和 Prefetch 的基本概念：

- **preload**: 关注点在当前页面，可以更细粒度地控制加载优先级，优化关键请求链；请求和执行分离并不会阻断 DOM 渲染，保证执行顺序。与浏览器预测解析不同的是，预测解析只能分析 HTML 中外链资源，无法收集到由异步或 CSS 中请求的资源，而 `preload` 支持指定**提前**请求那些可能会在页面加载中比较晚才引用的资源。`preload` 常用与加载样式表、首屏大图或 Web Fonts 以减少 FOUC（Flash of Unstyled Content）。
- **prefetch**: Link Prefetching 常用于预测用户最可能访问的下一个页面并允许浏览器在空闲时提前请求资源，因此它的请求优先级最低。现在 SWA 常用基于代码分割的异步请求路由，`prefetch` 可用于提前加载可能被访问到的路由资源，降低路由切换的延迟感；其他常用的 prefetch 包括 DNS Prefetching 和 Prerendering。

### Preload

在博客升级实践中，考虑到页面大部分内容是文字，样式闪烁和字体闪烁会带来很不好的体验，我主要使用 Preload  预加载  相关 CSS 和字体文件，并对跨域的字体文件加上 `crossorigin` 字段以避免因跨域造成的双重请求（Preflight Request 和 GET Request）

```html
<link
  href="https://fonts.gstatic.com/s/amaticsc/v11/TUZyzwprpvBS1izr_vOECuSfU5cP1Q.woff2"
  rel="preload"
  as="font"
  crossorigin
/>
<link
  href="/lib/font-awesome/fonts/fontawesome-webfont.woff2?v=4.7.0"
  rel="preload"
  as="font"
  crossorigin
/>
<link
  href="/lib/font-awesome/css/font-awesome.min.css?v=4.6.2"
  rel="preload"
  as="style"
/>
<link href="/css/main.css?v=6.4.2" rel="preload" as="style" />
```

![preload requests](/images/service-worker-in-practice/preload.jpg)
在 DevTool 的网络版面可以看到，所有请求都是按声明顺序加载的；添加了 `crossorigin` 的 Preload 请求优先级与 async XHR 一致，而设置了 `as="style"` 的请求拥有 Highest 优先权。

### Prefetch

在用户访问页面首页时， 大概率都会习惯性点开最吸引他/她的页面，或点击导航随意浏览网站的大致内容。在首屏加载完毕并且浏览器后台线程空闲时，提前请求就绪访问频率最高的二级页面资源，能极大地优化交互体验。在博客首页里，最常被访问的莫过于列表里排序最前的文章，通常是置顶或最近作品，可作为 Prefetch 目标对博客进行优化。

```javascript
window.addEventListener('load', () => {
  window.requestIdleCallback(() => {
    let prefetchArticle = document.createElement('link');
    let url = new URL(document.querySelector('.post-title-link').href);
    prefetchArticle.setAttribute('href', url.pathname + url.search);
    prefetchArticle.setAttribute('rel', 'prefetch');
    document.body.appendChild(prefetchArticle);
  });
});
```

因为使用 Prefetch 获取预测资源属于应用附加优化功能，需防止执行阻塞主线程的渲染和执行，因此在博客首页 <body> 底部，动态添加 `rel="prefetch"` 的首篇文章链接，并将这个过程放到 `requestIdleCallback` 回调函数中进行，当浏览器 Event Loop 运行空档再插入请求。关于 `requestIdleCallback`的具体用法请参考 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) 文档。

### MISC.

Chrome 底层有四种缓存：HTTP 缓存、内存缓存、Service Worker 缓存和 Push 缓存。`preload` 和 `prefetch` 是的资源储存在 HTTP 缓存中。因此，即使当 `prefetch` 请求完成后，也*无法断网访问*该资源。一般情况下，除非 cache hit 失败例如 HTTP 缓存过期等情况，当标记 `preload` 资源已存在 Service Worker 缓存或 HTTP 缓存时，不会再发起网络请求，而是直接返回缓存中的资源。

另外，在[浏览器请求优先级](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)中，使用 `as` 属性的 `preload` 或使用 `type` 属性的 `fetch` 的优先级与相对应的浏览器请求优先级一样，如 `<link rel=“preload” href=“/main.css" as=“style" />` 会有最高优先级，如果 `as` 不存在则与异步 XHR 优先级一致（High）。

然而 `preload` 存在的一些坑， 容易导致请求重复发送，浪费带宽资源：避免同时使用 `preload` 和 `prefetch` 去请求同一资源，这导致资源被请求两次；在 `preload` 时不使用 `as` 属性也会造成双重请求。在 `preload` 字体资源，无论资源跨域还是本域，都建议加上 `crossorigin` 属性以避免双重请求。

值得一说的是，当用户在 `prefetch` 请求未完成时离开了当前页面，`prefetch` 请求不会被终止，并且返回的资源无论本身的 HTTP 缓存策略如何，都会在浏览器缓存中保持 5 分钟。

## 性能测试

在应用了所有这些 Service Worker 特性后，我们使用 Chrome DevTool 中的性能测试工具给网站跑个分吧~ 首屏渲染 0.68s 是真的很不错 ٩(˃̶͈̀௰˂̶͈́)و 也不枉一个星期的搬砖和码了三天的字了哈哈哈哈！
![performance score](/images/service-worker-in-practice/performance_score.png)

## 相关阅读

- [Service Workers: an Introduction](https://developers.google.com/web/fundamentals/primers/service-workers/)
- [The Offline Cookbook](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook)
- [Introducing Background Sync](https://developers.google.com/web/updates/2015/12/background-sync)
- [使用 Service Worker 进行后台同步 - Background Sync](https://alienzhou.gitbook.io/learning-pwa/8-shi-yong-service-worker-jin-hang-hou-tai-tong-bu-background-sync)
- [Preload, Prefetch And Priorities in Chrome](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)
- [Speed up Service Worker with Navigation Preloads](https://developers.google.com/web/updates/2017/02/navigation-preload)
