const Router = require('koa-router')
const pageRouter = require('./page')
const postRouter = require('./post')
const pushRouter = require('./push')

let router = new Router()

router.use('/api/posts', postRouter.routes(), postRouter.allowedMethods())
router.use('/push', pushRouter.routes(), pushRouter.allowedMethods())
router.use('*', pageRouter.routes(), pageRouter.allowedMethods())


module.exports = router;
