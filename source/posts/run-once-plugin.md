---
title: run-once-plugin原理解析：绕过webpack配置直接操作plugin的加载和卸载
tags:
  - webpack
  - optimization
categories:
  - JavaScript
date: 2018-01-10 11:08:31
---

## 前言

在开发环境下，通常在使用 webpack 在简单的 watch 模式下监听文件内容变化重新编译代码的时候，webpack 将整个项目内匹配到的文件全部重新编译一遍，这就导致所有通过配置文件设置的 loader 和 plugin 需要重新执行来生成新代码。然而当项目本身比较小型时，类似于 HtmlWebpackPlugin 这种只需执行一次便可得出需要的文件，在 watch 下反复执行会大大降低每次编译的速度。然而，webpack 本身并没有可以操作 plugin 的加载和卸载时机的配置项，想要在 webpack 执行过程中手动卸载已执行过一次的插件的话，只能通过另外再写一个插件来实现了。

<!-- more -->

> 然而当你已经开始为项目引进前端路由或状态管理库时，说明项目已经发展到不适合在开发时只用 webpack 的 watch 模式来监听文件变化了。每次改动都带来全量的编译，需要再次分析文件之间的依赖、打包、合并代码，对比起 webpack-dev-server 的热更新，这种方法未免显得太原始且浪费时间。

run-once-plugin 本身是一个 webpack 的插件，它可以被视为其他插件的**中介**：它接受一组只需运行一次的插件，在 webpack 初始化记录即将被加载的插件钩子函数，并手动将其加入 webpack 的插件集合中；一轮编译过后，立刻从钩子 handlers 中删除之前记录的钩子函数，达到只运行一次的目的。因此，我们需要分析 webpack 插件加载的运行机制，以及编译时生成的 `compiler` 对象。如果想要了解 webpack 整个执行过程，可以参考淘宝 FED 的这篇文章 **[细说 webpack 之流程篇](http://taobaofed.org/blog/2016/09/09/webpack-flow/)**。

插件的代码 Repo: [https://github.com/jacelynfish/run-once-plugin](https://github.com/jacelynfish/run-once-plugin)
npm: [https://www.npmjs.com/package/run-once-plugin](https://www.npmjs.com/package/run-once-plugin)

## webpack 插件的加载

### 核心模型

初始化 webpack 对象其实是创建一个核心的 `Compiler` 对象，并往其中注入各种插件的钩子函数。`Compiler` 类是 `Tapable` 类的子类，其核心就是一个 PubSub 模型：`Compiler`注册了控制 webpack 运行流程的所有钩子，如`make`, `compile`, `emit`, `after-emit`等，并将各种插件的钩子函数注册到相应的钩子下。在运行过程中的不同时期，通过调用`compiler.applyPlugins`, `compiler.applyPluginsParallel`, `compiler.applyPluginsAsyncWaterfall`等函数，以同步或异步的方法调用已注册的钩子函数。

而 `Tapable` 这个构造函数只是简单地声明了一个私有对象集合 `this._plugins` 来管理已注册的钩子函数。

```JavaScript
// tapable/lib/Tapable.js
function Tapable() {
	this._plugins = {};
}

// ......

// 调用已注册的钩子函数
Tapable.prototype.applyPlugins = function applyPlugins(name) {
	if(!this._plugins[name]) return;
	var args = Array.prototype.slice.call(arguments, 1);
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++)
		plugins[i].apply(this, args);
};

// 为不同钩子注册钩子函数
Tapable.prototype.plugin = function plugin(name, fn) {
	if(Array.isArray(name)) {
		name.forEach(function(name) {
			this.plugin(name, fn);
		}, this);
		return;
	}
	if(!this._plugins[name]) this._plugins[name] = [fn];
	else this._plugins[name].push(fn);
};

// 调用插件 -> 调用钩子函数注册过程
Tapable.prototype.apply = function apply() {
	for(var i = 0; i < arguments.length; i++) {
		arguments[i].apply(this);
	}
};

module.exports = Tapable;
```

由此可见，webpack 的大部分功能都是由各种小插件集合而成，插件的集合只是简单的 key-val pair 对象，每次钩子被调用时，遍历调动相应的钩子函数数组便可执行各个插件的功能。

### 插件加载

在将用户通过 `webpack.config.js` 或其他配置文件传入的选项整合入 `options` 后，`webpack/lib/webpack.js` 被调用来创建 `compiler` 对象，并开始编译和构建的流程。在这个过程中插件被初始化：

```JavaScript
// webpack/lib/webpack.js

function webpack(options, callback) {
	//......
	let compiler;
	if(Array.isArray(options)) {
		compiler = new MultiCompiler(options.map(options => webpack(options)));
	} else if(typeof options === "object") {
		//......
		// 初始化 Compiler 对象
		compiler = new Compiler();
		compiler.context = options.context;
		compiler.options = options;
		new NodeEnvironmentPlugin().apply(compiler);

        // 遍历整合后 otpions的插件列表，逐一调用插件，获取并注册插件里的钩子函数
		if(options.plugins && Array.isArray(options.plugins)) {
			compiler.apply.apply(compiler, options.plugins);
		}

        // 调用"environment"和"after-environment"的钩子函数
		compiler.applyPlugins("environment");
		compiler.applyPlugins("after-environment");
		compiler.options = new WebpackOptionsApply().process(options, compiler);
	} else {
		throw new Error("Invalid argument: options");
	}
	if(callback) {
        // 检测是否 watch 模式
        //......

        // 开始构建和编译
		compiler.run(callback);
	}
	return compiler;
}
exports = module.exports = webpack;
```

在 watch 模式下，webpack 监听文件系统；当变化发生时，调用在 `watch-run` 钩子下的函数。然而这整个重新编译的过程使用的都是 **webpack 初始化时所创建的那个 `compiler` 实例**，所有 plugin 都是在初始化时已被加载进 `compiler` 的插件集合中，且并没有可以直接操纵私有插件集合的公有 API。因此，要是想在 webpack 运行过程中手动卸载部分插件，只能记录已安装的钩子函数，并在适当的钩子中把它们从从插件集合中删除。

## 插件源码解析

run-once-plugin 给两个钩子注册了钩子函数：`environment` 和 `after-emit`。它作为一个普通的插件，它的钩子函数也会在 `compiler.apply.apply(compiler, options.plugins);` 里被正常注册。

### 加载

由于 `environment` 是插件注册流程结束后第一个被调用的钩子，在 `environment` 钩子函数执行时，其他插件的钩子函数都已就位，而传给 run-once-plugin 的插件数组在注册前后，需要经过一下几个步骤：

1. 确认该钩子函数是第一次运行
2. 遍历传入 run-once-plugin 的插件数组：
   - 记录该插件注册钩子函数之前，`compiler` 对象中的插件集合为 `before`
   - 注册该插件的钩子函数
   - 记录插件注册结束后 `compiler` 对象中的插件集合为 `after`
   - 对比 `before` 和 `after`，获得该插件所有的钩子函数，将它们保存到私有对象 `this.additionalEnv` 中

```JavaScript
compiler.plugin(
    'environment',
    function environmentEvent(compilation, callback) {
        // 确保该钩子函数第一次运行
        if (!this._isRunned) {
            this.pluginList.forEach(item => {
                let { plugin, option } = item;
                item.additionalEnv = {};
                let before, after;
                // 保存 compiler 中插件集合在该插件注册前和注册后的状态
                before = deepClone(compiler._plugins);
                compiler.apply.apply(compiler, [new plugin(option)]);
                after = deepClone(compiler._plugins);

                // 对比 before 和 after，记录该插件新注册的钩子函数
                Object.keys(after).forEach(key => {
                    if (!before.hasOwnProperty(key)) {
                        item.additionalEnv[key] = traverseArray(
                            [],
                            after[key]
                        );
                    } else {
                        item.additionalEnv[key] = traverseArray(
                            item.additionalEnv[key]
                                ? item.additionalEnv[key]
                                : before[key],
                            after[key],
                            key
                        );
                    }
                });
            });
        }
    }.bind(this)
);
```

### 卸载

由于 `after-emit` 是整个编译流程中每次构建时最后一个被调用的钩子，在这里把已经运行过一次的插件从 `compiler` 的插件集合中卸载是个比较保守的选择。卸载的过程非常简单：首先将私有变量 `this._isRunned` 标记为 `true`，防止加载一次性插件的逻辑在下一轮 watch 中再次进行；然后对比 `compiler._plugins` 和已记录的 `this.additionalEnv`，并在删除 `compiler._plugins` 中删除记录在 `this.additionalEnv` 中的所有插件钩子函数。当这个过程完成之后，如被监听的文件发生改变，在下一轮 watch 的编译和构建时，`compiler` 中已经没有了之前注册的一次性插件。

```JavaScript
compiler.plugin(
    'after-emit',
    function afterCompileEvent(compilation, cb) {
        if (!this._isRunned) {
            this._isRunned = true;
            let compilerPlugins = compiler._plugins;

            // 在 compiler 中删除一次性插件的钩子函数
            this.pluginList.forEach(item => {
                let plugins = item.additionalEnv;
                Object.keys(plugins).forEach(key => {
                    if (plugins[key].length) {
                        let comp = compilerPlugins[key];
                        for (let fn of plugins[key]) {
                            var pos = comp.indexOf(fn);
                            if (pos != -1) comp.splice(pos, 1);
                        }
                    }
                });
            });
        }
        cb();
    }.bind(this)
);
```

## 吐槽与展望

由于 webpack 文档实在太简单粗暴，直接一句【你们去看源码吧】打发走想开发插件的人，没有办法为了写个插件硬着头皮把 webpack 的源码大致撸了一遍（其实只是弄懂大概流程（。一开始方向不太对，还是踩了一些坑。其实一开始的思路是，在加载阶段 new 一个 `subCompiler` 实例，然后调用 `runAsChild` 作为一个单独的 `compiler` 单独运行一次传进来的插件。下场当然是被各种 context 和 option 虐 QAQ。其实是直接操作数组的方法太简单所以一开始觉得可能真的没这么简单【所以就折腾了一整天【【。而且这里两个对象的深对比还是暴力地 n^2，也没有用其他库，觉得之后这里还是可以优化一下的吧~
按你胃，反正最后项目还是用回了 webpack-dev-server 让它热更了哈哈哈哈，这个小插件就当做一次练手和看 webpack 源码的借口吧 (๑•̀ ㅂ•́)و✧

## 相关阅读

- [Writing a Plugin](https://webpack.js.org/contribute/writing-a-plugin/) - webpack 官方文档
- [细说 webpack 之流程篇](http://taobaofed.org/blog/2016/09/09/webpack-flow/) - 淘宝前端团队
