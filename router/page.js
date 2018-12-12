const Router = require('koa-router');
const fs = require('fs');
const path = require('path');

const resolve = file => path.resolve(__dirname, file);
// 开放dist目录

// 第 2 步：获得一个createBundleRenderer
const { createBundleRenderer } = require('vue-server-renderer');
const bundle = require('../dist/vue-ssr-server-bundle.json');
const clientManifest = require('../dist/vue-ssr-client-manifest.json');

const renderer = createBundleRenderer(bundle, {
  runInNewContext: false,
  template: fs.readFileSync(resolve('../src/index.template.html'), 'utf-8'),
  clientManifest: clientManifest,
  basedir: resolve('../dist')
});

function renderToString(context) {
  return new Promise((resolve, reject) => {
    renderer.renderToString(context, (err, html) => {
      err ? reject(err) : resolve(html);
    });
  });
}

let pageRouter = new Router();
pageRouter.use(async (ctx, next) => {
  if (ctx.accepts()[0] === 'text/html' || ctx.accepts()[0] == '*/*') {
    await next();
  } else {
    ctx.throw(404, 'File does not exists!');
  }
});
pageRouter.get('/', async ctx => {
  const context = {
    title: 'ssr test',
    url: ctx.url,
    origin: ctx.origin
  };

  console.log('in router', ctx.url);
  // 将 context 数据渲染为 HTML
  const html = await renderToString(context);
  ctx.body = html;
});

module.exports = pageRouter;
