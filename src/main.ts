import Vue from 'vue';
import App from './App.vue';
import createRouter from './router/index';
import createStore from './store';
import './registerServiceWorker';
import { sync } from 'vuex-router-sync';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faZhihu,
  faGithub,
  faWeibo,
  faCodepen
} from '@fortawesome/free-brands-svg-icons';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faGithub, faWeibo, faZhihu, faCodepen, faHeart);

Vue.config.productionTip = false;

export default function createApp() {
  Vue.component('font-awesome-icon', FontAwesomeIcon);
  let router = createRouter();
  let store = createStore();

  sync(store, router);
  let app = new Vue({
    router,
    store,
    render: h => h(App)
  });
  return { app, router, store };
}
