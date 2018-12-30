const Router = require('koa-router')
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const PostDB = require('../db/Post')
let postRouter = new Router()
let postDB = new PostDB()

const TOC_LIMIT = 10

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
  let {
    page
  } = ctx.query

  let skip = typeof page != 'undefined' && page >= 1 ? (page - 1) * TOC_LIMIT : -1
  let limit = skip >= 0 ? TOC_LIMIT : 0
  let toc = await postDB.getTOC({
    skip,
    limit
  })
  let total = await postDB.getTotalCount()
  ctx.body = {
    data: toc,
    total,
    page: +page,
    limit
  }
})

postRouter.get('posts', '/detail/:title', async (ctx) => {
  let {
    title
  } = ctx.params
  let post = await postDB.getPost(title)
  if (post) {
    ctx.body = post
  } else {
    ctx.status = 404
    ctx.body = '文章不存在'
  }
})

module.exports = postRouter
