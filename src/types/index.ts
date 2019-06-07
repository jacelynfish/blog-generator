import Vue from 'vue';
import {Route} from 'vue-router';
import {Store} from 'vuex/types/index';

export type AsyncData = (
  params: {
    route: Route;
    baseURL?: string;
    store: Store<any>;
  }
) => Promise<any>;

export interface PostTOC {
  [propName: string]: {
    content: string;
    level: number;
    children: PostTOC;
  };
}

export interface PostMeta {
  title: string;
  date: string;
  pid: string | number;
  toc: PostTOC[];
  tags?: string[];
  categories?: string[];
  permalink?: string;
  comments?: string[];
}

export type TOC = PostMeta[];

export interface PostData extends PostMeta {
  content: string;
}
