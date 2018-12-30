const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const meta = require('markdown-it-meta');
const attrs = require('markdown-it-attrs')
const moment = require('moment');
const Post = require('../../db/Post')

const postDB = new Post()

const END_TOKEN = '@_end@'
const absPat = /<.*?(?:>|(@_end@$))|(\n)|(@_end@)/gi
const md = require('markdown-it')({
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs post-code__block"><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>'
        );
      } catch (__) {}
    }

    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    );
  }
});

const hljs = require('highlight.js');
md.use(meta).use(attrs)

// function AbstractPlugin(md) {
//   let defaultRender = md.renderer.rules.html_block
//   console.log(md.renderer.rules)
//   md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
//    console.log(tokens[idx])
//     // pass token to default renderer.
//     return defaultRender(tokens, idx, options, env, self);
//   };
//   // md.block.ruler.before('code', 'meta', metacb.bind(null, md), { alt: [] })
// }


module.exports = async function transform(id, source, target) {
  let article = await fsPromises.readFile(source, 'utf-8');
  let content = md.render(article);

  let abs = content.split(/<!--\s*(more)\s*-->/)[0]
  abs = abs.length > 500 ? abs.slice(0, 500) + END_TOKEN : abs

  let metaData = {
    ...md.meta,
    date: moment(md.meta.date ? md.meta.date : new Date()).valueOf(),
    abstract: abs.replace(absPat, (match, p1) => {
      let type = ''
      switch (match) {
        case END_TOKEN:
          type = '……';
          break;
        case '\n':
          type = ' ';
          break;
        default:
          type = p1 ? '……' : ''
          break;
          1
      }
      return type
    }).trim()
  };

  await postDB.savePost({
    id,
    meta: metaData,
    content
  })

  return metaData;
};
