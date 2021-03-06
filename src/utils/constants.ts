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
  avatar?: string;
  desc?: string;
}

export const FRIEND_LIST: ObjectType<FriendItem> = {
  r00t4dm: {
    title: '秋风',
    url: 'https://www.knowsec.net/',
    desc: 'Web安全 主攻Java/渗透'
  },
  lllapland: {
    title: 'Reflection',
    url: 'https://lllapland.github.io/',
    desc: '可爱的沫沫学神(˶‾᷄ ⁻̫ ‾᷅˵) USC在读'
  },
  umi: {
    title: '雾之湖',
    url: 'https://umi.cat/',
    desc: 'Umi哥哥 区块链/Web安全/算法/机器学习相关'
  }
};
