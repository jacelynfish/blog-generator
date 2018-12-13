const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const merge = require('lodash.merge');
const TARGET_NODE = process.env.WEBPACK_TARGET == 'node';
const target = TARGET_NODE ? 'server' : 'client';

const pwaConfig =
  process.env.NODE_ENV == 'production' ? {
    name: 'Jacelynfish 1995',
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/sw.js',
      importWorkboxFrom: 'local',
      importsDirectory: 'wb-assets'
    }
  } : {};

module.exports = {
  pwa: {
    ...pwaConfig
  },
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3007',
        changeOrigin: true
      }
    }
  },
  css: {
    extract: !(TARGET_NODE || process.env.NODE_ENV != 'production')
  },
  configureWebpack: () => ({
    entry: `./src/entry-${target}.js`,
    devtool: TARGET_NODE ? 'source-map' : 'cheap-module-source-map',
    target: TARGET_NODE ? 'node' : 'web',
    node: TARGET_NODE ? undefined : false,
    output: {
      libraryTarget: TARGET_NODE ? 'commonjs2' : undefined
    },
    externals: TARGET_NODE ?
      nodeExternals({
        whitelist: [/\.css$/]
      }) : undefined,
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
  }
};
