const Datastore = require('nedb')
const path = require('path')
const db = new Datastore({
  filename: path.resolve(__dirname, './post.db'),
  autoload: true
})
db.ensureIndex({
  fieldName: 'pid',
  unique: true
})

function call(ctx, func, ...args) {
  return new Promise((resolve,reject) => {
    func.apply(ctx, args, (err, res) => {
      if(err) reject(err)
      else resolve(res)
    })
  })
}

class Post {
  constructor(props) {
    this.db = db
  }
  async savePost({id, meta, content}) {
    await call(this.db, this.db.update, 
      {pid: id}, {$set: { meta, content }}, {upsert: true})
  }
  async getMeta() {
    let metas = await call(this.db, this.db.find, {}, {meta: 1})
    return metas.map(m => m.meta)
  }
  async getTags() {
    let metas = await this.getMeta()
  } 
}

module.exports = Post