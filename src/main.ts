import Vue from 'vue';
import App from './App.vue';
import createRouter from './router/index';
import createStore from './store';
import './registerServiceWorker';
import { sync } from 'vuex-router-sync';

Vue.config.productionTip = false;

export default function createApp() {
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
