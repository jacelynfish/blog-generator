const Datastore = require('nedb')
const path = require('path')

class Subscription {
  constructor(props) {
    let db = new.target.db ? new.target.db : new Datastore({
      filename: path.resolve(__dirname, './subscription.db'),
      autoload: true
    })
    db.ensureIndex({
      fieldName: 'uid',
      unique: true
    })

    new.target.db = db
    this.db = db
  }
  async saveSubscription({uid, subscription}) {
    let res = await new Promise((resolve, reject) => {
      this.db.update({uid}, {$set: { subscription }}, {upsert: true}, (err, res) => {
        if(err) reject(err)
        else resolve(res)
      })
    })
  }
  async getSubscription(uid) {
    let docs = await new Promise((resolve, reject) => {
      if(typeof uid == "undefined") {
        reject('UID not specified')
      }
      this.db.find({ uid }, (err, docs) => {
        if(err) reject(err)
        else resolve(docs)
      }) 
    })
    return docs
  }
  
}

module.exports = Subscription