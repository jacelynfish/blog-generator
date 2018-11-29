const gulp = require('gulp')
const {
  series,
  parallel,
  src,
  dest
} = gulp
const path = require('path')
const minimist = require('minimist')
const imagemin = require('gulp-imagemin')

async function image() {
  let {
    posts
  } = minimist(process.argv.slice(6))
  posts = Array.isArray(posts) ? posts : [posts]

  return src(posts.map(post => `source/images/${post}/**`))
    .pipe(imagemin())
    .pipe(dest(obj => {
      let dirs = obj.dirname.split(path.sep)
      let root = dirs[dirs.length - 1]
      return `public/images${root =='images'? '' : `/${root}`}`
    }))
}

exports.default = series(image)
