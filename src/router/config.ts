import Vue from 'vue';

export interface _RouteConfig {
  path: string;
  title: string;
  inNav?: boolean;
  // component: string;
}
// | typeof Vue | (() => Promise<any>)

export type Config = {
  [propName: string]: _RouteConfig;
};

const createConfig: () => Config = () => {
  let config: Config = {
    archive: {
      inNav: true,
      path: '/archive',
      title: '归档'
    },
    post: {
      path: '/post/:title',
      title: '文章'
    },
    home: {
      path: '/home',
      title: '主页'
    }
  };
  return config;
};

export default createConfig;
