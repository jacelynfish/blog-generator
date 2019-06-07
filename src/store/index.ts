import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import Mock from 'mockjs';
import moment from 'moment';
import push from './push';
import post from './post';

import {PostData} from '../types';

Vue.use(Vuex);

export default function createStore() {
  return new Vuex.Store({
    modules: {
      push,
      post
    },
    state: {
      toc: []
    },
    mutations: {
      SET_TOC(state, {toc}) {
        for (let i = 0; i < toc.length; i++) {
          const post = toc[i];
          const date = moment(post.date).format('MMMM');

          post.dateDesc =
            i == 0 || date != moment(toc[i - 1].date).format('MMMM')
              ? date
              : undefined;
          post.date = moment(post.date).format('YYYY-MM-DD HH:mm');
        }
        state.toc = toc;
      }
    },
    actions: {
      GET_TOC({commit}, {baseURL}) {
        return axios(`/toc`, {
          baseURL: `${baseURL}/api/posts/`
        })
          .then(res => {
            commit('SET_TOC', {toc: res.data.data});
          })
          .catch(err => {
            console.log('in get toc', err);
          });
      }
    }
  });
}
