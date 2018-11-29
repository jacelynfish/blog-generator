<template>
  <div>
    <header class="post__title" :data-bg-url="post.meta.background_url">
      <h1>
        {{post.meta.title}}
        <span class="post__title-date">{{post.meta.date}}</span>
      </h1>
    </header>
    <main class="post">
      <article class="post__content" v-html="post.content"></article>
    </main>
  </div>
</template>
<script lang="ts">
import 'highlight.js/styles/zenburn.css';

import { Component, Vue } from 'vue-property-decorator';
import { AsyncData, PostData } from '../types/index';
import { State } from 'vuex-class';

@Component
class PostContainer extends Vue {
  public static asyncData: AsyncData = ({ store, baseURL, route }) => {
    return store.dispatch('GET_POST', {
      title: route.params.title,
      baseURL
    });
  };

  @State public post!: PostData;
}

export default PostContainer;
</script>

<style lang="scss">
@import '@/style/post.scss';

.post__title {
  text-align: center;
  padding: 12em 8%;
  margin: -64px 0 64px;
  background: $ins-gradient;
  color: white;
  h1 {
    margin: 0;
    display: inline-block;
    text-align: left;
  }
  .post__title-date {
    font-size: 14px;
    font-weight: normal;
    display: block;
    line-height: 2.5;
  }
}
</style>

