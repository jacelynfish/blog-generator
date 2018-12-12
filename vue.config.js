const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const merge = require('lodash.merge');
const TARGET_NODE = process.env.WEBPACK_TARGET == 'node';
const target = TARGET_NODE ? 'server' : 'client';

const pwaConfig =
  process.env.NODE_ENV == 'production'
    ? {
        name: 'Jacelynfish 1995',
        workboxPluginMode: 'InjectManifest',
        workboxOptions: {
          swSrc: 'src/sw.js',
          importWorkboxFrom: 'local',
          importsDirectory: 'wb-assets'
        }
      }
    : {};

module.exports = {
  pwa: {
    ...pwaConfig
  },
  configureWebpack: () => ({
    entry: `./src/entry-${target}.js`,
    devtool: 'source-map',
    target: TARGET_NODE ? 'node' : 'web',
    node: TARGET_NODE ? undefined : false,
    output: {
      libraryTarget: TARGET_NODE ? 'commonjs2' : undefined
    },
    externals: TARGET_NODE
      ? nodeExternals({
          whitelist: [/\.css$/]
        })
      : undefined,
    optimization: {
      splitChunks: undefined
    },
    plugins: [TARGET_NODE ? new VueSSRServerPlugin() : new VueSSRClientPlugin()]
  }),

  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        merge(options, {
          optimizeSSR: false
        });
      });

    if (TARGET_NODE) {
      console.log(config.module.rules[1]);
      // config.module
      //   .rule('servercss')
      //   .test(/\.(sa|sc|c)ss$/)
      //   .use('css-loader/locals')
      //   .loader('css-loader/locals')
      //   .end();
    }
  }
};
