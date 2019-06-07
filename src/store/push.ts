import axios from 'axios';

export default {
  namespaced: true,
  state: {
    pushInfo: {
      uid: ''
    }
  },
  getters: {
    pushInfo(state) {
      return state.pushInfo;
    }
  },
  mutations: {
    SET_PUSH_INFO(state, {info}) {
      state.pushInfo = info;
    }
  },
  actions: {
    SAVE_WEBPUSH_SUB({state, commit}, {subscription}) {
      const uid = state.pushInfo.uid.length
        ? state.pushInfo.uid
        : `${new Date().valueOf()}`;
      const data = {
        subscription,
        uid
      };
      commit('SET_PUSH_INFO', {
        info: {uid}
      });
      return axios
        .post('/subscription', data, {
          baseURL: `/push/`
        })
        .then(res => {
          console.log(res);
        });
    }
  }
};
