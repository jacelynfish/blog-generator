import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import Mock from 'mockjs';
import { PostData } from './types';

Vue.use(Vuex);

export default function createStore() {
  return new Vuex.Store({
    state: {
      toc: {
        _list: [],
        posts: {}
      },
      post: {
        meta: {},
        content: ''
      }
    },
    mutations: {
      SET_TOC(state, { toc }) {
        state.toc = toc;
      },
      SET_POST(state, { data }) {
        state.post = data;
      }
    },
    actions: {
      GET_TOC({ commit }, { baseURL }) {
        return axios(`/toc`, {
          baseURL: `${baseURL}/api/posts/`
        })
          .then(res => {
            commit('SET_TOC', { toc: res.data });
          })
          .catch(err => {
            console.log('in get toc', err);
          });
      },
      GET_POST({ commit }, { title, baseURL }) {
        return axios(`/detail/${title}`, {
          baseURL: `${baseURL}/api/posts/`
        })
          .then(res => commit('SET_POST', res))
          .catch(err => {
            console.log('in get post', baseURL);
          });
      }
    }
  });
}
