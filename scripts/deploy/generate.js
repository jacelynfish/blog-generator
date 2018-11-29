const path = require('path')
const transform = require('./articleTransform')
const fs = require('fs')
const moment = require('moment')
const process = require('process');

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
const fsPromises = fs.promises
/**
 * [generate 创建渲染、筛选流程，从模板里生成项目]
 * @param  {String}   src  [源文件的原始路径]
 * @param  {String}   dest [生成文件的目标路径]
 * @param  {String} id [文件ID]
 * @return Promise
 */
async function generate(files) {

  // src, dest, id
  // generate table of content data
  let tocdir = path.resolve(process.cwd(), './post/_toc.json')
  let toc = await fsPromises.readFile(tocdir, 'utf-8')
    .then(res => res.length ? JSON.parse(res) : {
      _list: [],
      posts: {}
    })

  for (let file of files) {
    let src = path.resolve(process.cwd(), 'source/posts', file)
    let id = file.split('.')[0]
    let dest = path.resolve(process.cwd(), 'post', `${id}.json`);

    let meta = await transform(src, dest)
    if (toc._list.indexOf(id) < 0) toc._list.push(id)
    toc.posts[id] = meta
  }
  toc._list = toc._list.sort((a, b) => {
    return moment(toc.posts[a].date, TIME_FORMAT).isAfter(moment(toc.posts[b].date, TIME_FORMAT))
  })
  await fsPromises.writeFile(tocdir, JSON.stringify(toc), 'utf-8')

  // const metalsmith = Metalsmith(path.join(src, 'template'))
  // const metadata = require(path.join(src, 'meta.json'))
  // const dirs = src.split(path.sep)

  //  metalsmith
  //     .metadata({
  //         CWD: src,
  //         projectName: dirs[dirs.length - 1]
  //      })
  //     .clean(false)
  //     .use(prompt(metadata.prompts, metalsmith.metadata()))
  //     .use(filter(metadata.filters))
  //     .use(render())
  //     .source('.')
  //     .destination(dest)
  //     .build(done)
}
module.exports = generate
