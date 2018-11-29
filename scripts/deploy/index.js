#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const process = require('process');
const generate = require('./generate');
const util = require('util');
const {
  exec,
  spawn
} = require('child_process')
const execP = util.promisify(require('child_process').exec);

const fsPromise = fs.promises

program
  .description('部署博客数据')
  .usage('<input-file-path> [options]')
  .option(
    '-o, --output <name>',
    `自定义输出文件名，默认与输入文件名相同。该输出名将作为访问该文章的唯一ID。`
  )

program.parse(process.argv);

run();

async function run() {
  let files = program.args.length ? program.args : await fsPromise.readdir(path.resolve(process.cwd(), 'source/posts'))
  let ids = files.map(file => file.split('.')[0])

  await generate(files)
    .then(() => {
      console.log(chalk.green(`成功部署 ${ids.join(', ')}！`))
    }).catch(err => console.log(chalk.red(`部署${ids}错误：${err}`)));

  await execP(`gulp --cwd ${process.cwd()} -f ${path.resolve(__dirname, 'gulpfile.js')} ${ids.map(id => `--posts ${id}`).join(' ')}`, {
      cwd: process.cwd()
    }).then(res => console.log(chalk.green(`成功运行 Gulp 任务`)))
    .catch(err => console.log(chalk.red(err)))
}
