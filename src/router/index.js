import Vue from 'vue';
import Router from 'vue-router';
import createConfig, {
  Config
} from './config';
import { BLOG_META } from '../utils/constants'

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
        component: Archive,
        meta: {
          title: `归档 | ${BLOG_META.name}`
        }
      },
      {
        path: '/post/:title',
        name: 'post',
        component: Post,
        meta: {
          title: (to) => `${to.params.name ? to.params.name : ''} | ${BLOG_META.name}`
        }
      },
      {
        path: '/offline',
        name: 'offline',
        component: Offline,
        props: true,
        meta: {
          title: `失联啦~ | ${BLOG_META.name}`
        }
      },
      {
        path: '/home',
        name: 'home',
        component: Home,
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
