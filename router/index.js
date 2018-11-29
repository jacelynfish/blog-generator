const Router = require('koa-router')
const pageRouter = require('./page')
const postRouter = require('./post')

let router = new Router()

router.use('/api/posts', postRouter.routes(), postRouter.allowedMethods())
router.use('*', pageRouter.routes(), pageRouter.allowedMethods())


module.exports = router;
