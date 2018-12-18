import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import Mock from 'mockjs';
import moment from 'moment';

import { PostData } from './types';

Vue.use(Vuex);

export default function createStore() {
  return new Vuex.Store({
    state: {
     pushInfo: {
      uid: '',
     },
      toc: {
        _list: [],
        posts: {}
      },
      post: {
        meta: {},
        content: ''
      }
    },
    getters: {
      pushInfo(state) {
        return state.pushInfo
      }
    },
    mutations: {
      SET_TOC(state, { toc }) {
        // let date = this.toc.posts[this.toc._list[idx]].date
        //   return moment(date).format("MMM");
        for (let i = 0; i < toc._list.length; i++) {
          let post = toc.posts[toc._list[i]];
          let date = moment(post.date).format('MMMM');

          post.dateDesc =
            i == 0 ||
            date != moment(toc.posts[toc._list[i - 1]].date).format('MMMM')
              ? date
              : undefined;
        }
        state.toc = toc;
      },
      SET_POST(state, { data }) {
        state.post = data;
      },
      SET_PUSH_INFO(state, {info}) {
        state.pushInfo = info
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
        }).then(res => commit('SET_POST', res));
      },
      SAVE_WEBPUSH_SUB({ state, commit },{ subscription }) {
        let uid = state.pushInfo.uid.length? state.pushInfo.uid : `${new Date().valueOf()}`
        let data = {
          subscription, 
          uid
        }
        commit('SET_PUSH_INFO', {
          info: { uid }
        })
        return axios.post('/subscription', data, {
          baseURL: `/push/`
        }).then(res => {
          console.log(res)
        })
      }
    }
  });
}
