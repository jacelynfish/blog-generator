export const BLOG_META = {
  domain: 'jacelyn.fish',
  name: '1995'
};

interface ObjectType<T> {
  [propName: string]: T;
}

export interface SocialItem {
  name: string;
  url: string;
  icon?: string;
}
export const SOCIAL_LINKS: ObjectType<SocialItem> = {
  weibo: {
    name: '微博',
    url: 'https://weibo.com/jacelynfish'
  },
  github: {
    name: 'GitHub',
    url: 'https://github.com/jacelynfish'
  },
  codepen: {
    name: 'CodePen',
    url: 'https://codepen.io/jacelynfish'
  }
};

export interface FriendItem {
  title: string;
  url: string;
  desc?: string;
}

export const FRIEND_LIST: ObjectType<FriendItem> = {
  r00t4dm: {
    title: '秋风',
    url: 'https://www.knowsec.net/'
  },
  lllapland: {
    title: 'Reflection',
    url: 'https://lllapland.github.io/'
  },
  umi: {
    title: '雾之湖',
    url: 'https://umi.cat/'
  }
};
