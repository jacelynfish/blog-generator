import Vue from 'vue';
import App from './App.vue';
import createRouter from './router/index';
import createStore from './store/index';
// import './registerServ/iceWorker';
import {sync} from 'vuex-router-sync';

import {library} from '@fortawesome/fontawesome-svg-core';
import {
  faZhihu,
  faGithub,
  faWeibo,
  faCodepen
} from '@fortawesome/free-brands-svg-icons';
import {faHeart, faChevronUp} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';

library.add(faGithub, faWeibo, faZhihu, faCodepen, faHeart, faChevronUp);

Vue.config.productionTip = false;

export default function createApp() {
  let scrollCB: EventListener;
  Vue.component('font-awesome-icon', FontAwesomeIcon);
  Vue.directive('scroll', {
    inserted: (el, binding) => {
      let isScrolling = false;
      scrollCB = (e: Event) => {
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(() => {
            isScrolling = false;
            binding.value(e);
          });
        }
      };
      window && window.addEventListener('wheel', scrollCB);
    },
    unbind: (el, binding) => {
      window && window.removeEventListener('wheel', scrollCB);
    }
  });
  let router = createRouter();
  let store = createStore();

  sync(store, router);
  let app = new Vue({
    router,
    store,
    render: h => h(App)
  });
  return {app, router, store};
}
