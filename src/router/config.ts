import Home from '../views/Home.vue';
import Vue from 'vue';
export interface RouteConfig {
  path: string;
  title: string;
  inNav?: boolean;

  component: typeof Vue | (() => Promise<any>);
}

let config: {
  [propName: string]: RouteConfig;
} = {
  home: {
    inNav: true,
    path: '/home',
    title: '主页',
    component: Home
  },
  archive: {
    inNav: true,
    path: '/archive',
    title: '存档',
    component: () =>
      import(/* webpackChunkName: "post" */ '../views/Archive.vue')
  },
  post: {
    path: '/post/:title',
    title: '文章',
    component: () => import(/* webpackChunkName: "post" */ '../views/Post.vue')
  }
};

export default config;
