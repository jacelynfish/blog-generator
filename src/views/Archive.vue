<template>
  <main class="archive">
    <ul class="archive__list">
      <li v-for="tag in toc._list" :key="tag">
        <router-link :to="{name: 'post', params: {title: tag}}">{{toc.posts[tag].title}}</router-link>
      </li>
    </ul>
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
class Archive extends Vue {
  public static asyncData: AsyncData = getTOC;

  mounted() {
    if (!this.toc._list.length)
      getTOC({
        store: this.$store,
        route: this.$route,
        baseURL: location.origin
      });
  }

  @State("toc")
  public toc!: TOC;
}

export default Archive;
</script>
