<template>
  <main class="home">
    <section class="toc__post-item" v-for="post in toc._list" :key="post">
      <h3>
        <router-link :to="{name: 'post', params: {title: post}}">{{toc.posts[post].title}}</router-link>
      </h3>
      <!-- <p class="toc__post-abstract" v-html="toc.posts[post].abstract"></p> -->
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
@import "@/style/_theme.scss";

.toc__post-item {
  padding: 32px 0;
}
.toc__post-abstract {
  font-size: 13px;
  opacity: 0.5;
  line-height: 1.8;
  &:hover {
    opacity: 0.8;
  }
}
.toc__post-date {
  font-size: 14px;
  font-style: italic;
  margin-right: 1em;
  &::before {
    content: "Published on: ";
  }
}
.toc__post-tag {
  display: inline-block;
  font-size: 14px;
  margin: 0.5em 0;
  &::before {
    content: "Tags: ";
  }
  li {
    color: white;
    background-color: $text-highlight;
    border-radius: 4px;
    padding: 0 4px;
    display: inline-block;
    margin-right: 8px;
    border-bottom: 1px solid dashed;
    &:last-child {
      margin-right: 0px;
    }
  }
}

@media (max-width: 600px) {
  .toc__post-tag {
    display: block;
  }
}
</style>

