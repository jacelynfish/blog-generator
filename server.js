const fs = require('fs');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser')
const path = require('path');
const koaStatic = require('koa-static');
const app = new Koa();
const router = require('./router');
const json = require('koa-json');

const resolve = file => path.resolve(__dirname, file);

app.use(bodyParser())
app.use(
  json({
    pretty: false
  })
);

app.use(
  koaStatic(resolve('./dist'), {
    defer: false,
    index: null,
    maxage: 1000 * 60 * 30 // 30min
  })
);

app.use(router.routes()).use(router.allowedMethods());

const port = 3007;
app.listen(port, function () {
  console.log(`server started at localhost:${port}`);
});
