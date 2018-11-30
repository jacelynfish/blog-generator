const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const meta = require('markdown-it-meta');
const attrs = require('markdown-it-attrs')
const moment = require('moment');

const md = require('markdown-it')({
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
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
md.use(meta).use(attrs);

module.exports = async function transform(source, target) {
  let targetFile = await fsPromises.open(target, 'w');
  let article = await fsPromises.readFile(source, 'utf-8');
  let content = md.render(article);
  let metaData = {
    ...md.meta,
    date: moment(md.meta.date ? md.meta.date : new Date()).format(
      'YYYY-MM-DD HH:mm:ss'
    )
  };
  await fsPromises.writeFile(
    targetFile,
    JSON.stringify({
      meta: metaData,
      content
    }),
    'utf-8'
  );
  return metaData;
};
