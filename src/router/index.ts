import Vue from 'vue';
import Router from 'vue-router';
import config from './config';
Vue.use(Router);

export default function createRouter() {
  let routes = Object.keys(config).map(key => ({
    ...config[key],
    name: key
  }));
  return new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [...routes, { path: '*', redirect: '/home' }],
    scrollBehavior(to, from, savedPosition) {
      return { x: 0, y: 0 };
    }
  });
}
