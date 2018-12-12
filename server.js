const fs = require("fs");
const Koa = require("koa");
const path = require("path");
const koaStatic = require('koa-static')
const app = new Koa();
const router = require('./router')
const json = require('koa-json')

const {
  JSDOM
} = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
})

global.window = dom.window
global.document = window.document
global.navigator = window.navigator

const resolve = file => path.resolve(__dirname, file);

app.use(json({
  pretty: false
}))

app.use(koaStatic(resolve('./dist'), {
  defer: false,
  index: null,
  maxage: 1000 * 60 * 30, // 30min
}))

app.use(router.routes()).use(router.allowedMethods())

const port = 3007;
app.listen(port, function () {
  console.log(`server started at localhost:${port}`);
});
