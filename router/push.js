const Router = require('koa-router')
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const pushConfig = require('../webpush.config.json')
const webpush = require('web-push')
const Subscription = require('../db/Subscription')
let pushRouter = new Router()
let subDB = new Subscription()

let SUBSCRIPTION = {};

webpush.setVapidDetails(
  'mailto:jacelyn.hyjin@gmail.com',
  pushConfig.publicKey,
  pushConfig.privateKey
)

// pushRouter.use(async (ctx, next) => {
//   if (ctx.hostname == 'localhost') {
//     ctx.set('Access-Control-Allow-Origin', `*`);
//     ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
//     ctx.set('Access-Control-Expose-Headers', 'Content-Length,Content-Range')
//     ctx.set('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range')
//   }
//   await next()
// })

pushRouter.get('/pubkey', async ctx => {
  ctx.body = {
    data: pushConfig.publicKey
  }
})

pushRouter.post('/subscription', async ctx => {
  const { uid, subscription } = ctx.request.body
  await subDB.saveSubscription({uid, subscription})
  ctx.body = 'Successfully subscribe to push services!'
})

pushRouter.post('/push_mes', async ctx => {
  const { uid, payload } = ctx.request.body
  if(typeof uid == 'undefined') {
    ctx.status = 404
    ctx.body = "Please specify a uid"
  }else {
    let subscriptions = await subDB.getSubscription(uid).catch(err => {
      console.log(err)
    })
    for(let item of subscriptions) {
      await webpush.sendNotification(item.subscription, JSON.stringify({
        title: 'Default Title',
        body: 'You have an unread message.',
        tag: uid ? uid: 0,
        ...payload
      })).catch(err => {
        console.log(`WebPush Error: ${err.statusCode}`)
      })
    }
    ctx.body = 'Successfully push to clients'
  }
 
})


module.exports = pushRouter
