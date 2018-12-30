import axios from 'axios';

export default {
  namespaced: true,
  state: {
    content: '',
    title: '',
    date: new Date().valueOf(),
    pid: '',
    tags: [],
    categories: [],
    comments: []
  },
  getters: {},
  mutations: {
    SET_POST(state, {data}) {
      state = Object.assign(state, data);
    }
  },
  actions: {
    GET_POST({commit}, {title, baseURL}) {
      return axios(`/detail/${title}`, {
        baseURL: `${baseURL}/api/posts/`
      }).then(res => commit('SET_POST', res));
    }
  }
};
