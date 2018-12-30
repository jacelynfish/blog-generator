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
  return new Promise((resolve, reject) => {
    func.apply(ctx, [...args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    }])
  })
}

class Post {
  constructor(props) {
    this.db = db
  }
  async savePost({
    id,
    meta,
    content
  }) {
    await call(this.db, this.db.update, {
      pid: id
    }, {
      $set: {
        ...meta,
        content
      }
    }, {
      upsert: true
    })
  }
  async getTotalCount() {
    let records = await call(this.db, this.db.find, {})
    return records.length
  }
  async getPost(pid) {
    let [post] = await call(this.db, this.db.find, {
      pid
    }, {
      _id: 0
    })
    return post
  }
  async getMeta({
    skip,
    limit
  }) {
    let proc = this.db.find({}).sort({
      date: -1
    }).projection({
      content: 0,
      _id: 0,
    })
    if (skip >= 0) proc = proc.skip(skip).limit(limit)
    let metas = await call(proc, proc.exec)
    return metas
  }

  async getTOC(params) {
    let metas = await this.getMeta(params)
    return metas
  }

  async getTags() {
    let metas = await this.getMeta()
    let _tags = {}
    metas.forEach(({
      tags,
      pid
    }) => {
      tags.forEach(tag => {
        if (_tags[tag]) _tags[tag].add(pid)
        else _tags[tag] = new Set([pid])
      })
    });
    Object.keys(_tags).forEach(key => {
      _tags[key] = [..._tags[key]]
    })
    return _tags
  }
}

module.exports = Post
