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
 
  let records = []
  for (let file of files) {
    let src = path.resolve(process.cwd(), 'source/posts', file)
    let id = file.split('.')[0]
    let dest = path.resolve(process.cwd(), 'post', `${id}.json`);
    records.push({
      src, id, dest
    })
  }
  await Promise.all(records.map(({id, src, dest}) => transform(id, src, dest)
  )).catch(err => {
    console.log('generate',err)
  })
  
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
