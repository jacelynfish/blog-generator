import Vue from 'vue';
import { Route } from 'vue-router';
import { Store } from 'vuex/types/index';

export type AsyncData = (
  params: {
    route: Route;
    baseURL?: string;
    store: Store<any>;
  }
) => Promise<any>;

export interface PostMeta {
  title: string;
  date: string;
  tags?: string[];
  categories?: string[];
}

export interface TOC {
  _list: string[];
  posts: {
    [propName: string]: PostMeta;
  };
}

export interface PostData {
  meta: PostMeta;
  content: string;
}
