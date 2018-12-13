import Vue from 'vue';
import Router from 'vue-router';
import createConfig, {
  Config
} from './config';

import Offline from '../views/Offline.vue'

const Home = () => import('../views/Home.vue')
const Archive = () => import('../views/Archive.vue')
const Post = () => import('../views/Post.vue');
Vue.use(Router);

if (process.env.WEBPACK_TARGET == 'node') {
  window.scrollTo = () => {};
}

export default function createRouter() {
  return new Router({
    mode: 'history',
    // base: process.env.BASE_URL,
    fallback: false,
    routes: [{
        path: '/archive',
        name: 'archive',
        component: Archive
      },
      {
        path: '/post/:title',
        name: 'post',
        component: Post
      },
      {
        path: '/offline',
        name: 'offline',
        component: Offline,
        props: true
      },
      {
        path: '/home',
        name: 'home',
        component: Home
      },
      {
        path: '*',
        redirect: '/home'
      }
    ],
    scrollBehavior(to, from, savedPosition) {
      return {
        x: 0,
        y: 0
      };
    }
  });
}
