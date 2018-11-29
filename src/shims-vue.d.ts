declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

// declare module 'vue/types/options' {
//   import Vue from 'vue';
// import Router from 'vue-router';
// import { Store } from 'vuex/types/index';

//   interface ComponentOptions<V extends Vue> {
//     asyncData?:(
//       params: {
//         router?: Router;
//         store: Store<any>;
//       }
//     )=> Promise<any>;
//   }
// }
