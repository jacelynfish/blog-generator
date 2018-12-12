import Vue from 'vue';

export interface _RouteConfig {
  path: string;
  title: string;
  inNav?: boolean;
  // component: string;
}
// | typeof Vue | (() => Promise<any>)

export type Config = {
  [propName: string]: _RouteConfig;
};

const createConfig: () => Config = () => {
  let config: Config = {
    archive: {
      inNav: true,
      path: '/archive',
      title: '归档'
      // component: () =>
      //   import(/* webpackChunkName: "post" */ '../views/Archive.vue')
    },
    post: {
      path: '/post/:title',
      title: '文章'
      // component: () =>
      //   import(/* webpackChunkName: "post" */ '../views/Post.vue')
    },
    home: {
      path: '/home',
      title: '主页'
    }
  };
  return config;
};

export default createConfig;
