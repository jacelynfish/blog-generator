import Vue from 'vue';
import Router from 'vue-router';
import createConfig, {
  Config
} from './config';

import Home from '../views/Home.vue';
import Offline from '../views/Offline.vue'

const Archive = () => {
  let a = import('../views/Archive.vue').then(m => {
    console.log(m);
    return m;
  });

  console.log(a);
  return a;
};
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
