const Router = require('koa-router')
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
let postRouter = new Router()

postRouter.use(async (ctx, next) => {
  if (ctx.hostname == 'localhost') {
    ctx.set('Access-Control-Allow-Origin', `*`);
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    ctx.set('Access-Control-Expose-Headers', 'Content-Length,Content-Range')
    ctx.set('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range')
  }
  await next()
})

postRouter.get('toc', '/toc', async ctx => {
  let res = await fsPromises.readFile(
    path.resolve(__dirname, '../post', `_toc.json`),
    'utf-8')
  ctx.body = res
})

postRouter.get('posts', '/detail/:title', async (ctx) => {
  let {
    title
  } = ctx.params

  let res = await fsPromises.readFile(
    path.resolve(__dirname, '../post', `${title}.json`),
    'utf-8')
  ctx.body = res
})

module.exports = postRouter
