import Vue from 'vue';
import Router from 'vue-router';
import createConfig, { Config } from './config';

import Home from '../views/Home.vue';
import Archive from '../views/Archive.vue';
import Post from '../views/Post.vue';

Vue.use(Router);

export default function createRouter() {
  return new Router({
    mode: 'history',
    // base: process.env.BASE_URL,
    // fallback: false,
    routes: [
      {
        path: '/archive',
        name: 'archive',
        component: Archive
        // component: () =>
        //   import(/* webpackChunkName: "post" */ '../views/Archive.vue')
      },
      {
        path: '/post/:title',
        name: 'post',
        component: Post
        // component: () =>
        //   import(/* webpackChunkName: "post" */ '../views/Post.vue')
      },
      {
        path: '/home',
        name: 'home',
        component: Home
        // component: () =>
        //   import(/* webpackChunkName: "post" */ '../views/Home.vue')
      },
      { path: '*', redirect: '/home' }
    ]
    // scrollBehavior(to, from, savedPosition) {
    //   return { x: 0, y: 0 };
    // }
  });
}
