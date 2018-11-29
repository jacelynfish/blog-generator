<template>
  <main class="home">
    <section class="toc__post-item" v-for="post in toc._list" :key="post">
      <h3>
        <router-link :to="{name: 'post', params: {title: post}}">{{toc.posts[post].title}}</router-link>
      </h3>
      <span class="toc__post-date">{{toc.posts[post].date}}</span>
      <ul class="toc__post-tag">
        <li v-for="tag in toc.posts[post].tags" :key="tag">{{tag}}</li>
      </ul>
    </section>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { AsyncData, TOC } from "../types/index";
import { State } from "vuex-class";

let getTOC: AsyncData = ({ store, baseURL }) => {
  return store.dispatch("GET_TOC", {
    baseURL
  });
};
@Component
class Home extends Vue {
  public static asyncData: AsyncData = getTOC;

  @State("toc")
  public toc!: TOC;
}

export default Home;
</script>
<style lang="scss">
.toc__post-tag li {
  display: inline-block;
  margin-right: 8px;
  border-bottom: 1px solid dashed;
  &:last-child {
    margin-right: 0px;
  }
}
</style>

