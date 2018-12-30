<template>
  <main class="archive">
    <ul class="archive__list">
      <li
        v-for="item in toc"
        :key="item.pid"
        :class="[item.dateDesc ? 'archive__list-item-has-desc' : '']"
        :data-date-desc="item.dateDesc"
      >
        <router-link
          :to="{name: 'post', params: {title: item.pid, name: item.title }}"
        >{{item.title}}</router-link>
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
    if (!this.toc.length)
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
<style lang="scss">
@import "@/style/common.scss";

.archive__list {
  li {
    line-height: 2;
    position: relative;
    &.archive__list-item-has-desc {
      margin-top: 1em;
      &:before {
        display: block;
        content: attr(data-date-desc);
      }
    }

    a {
      &:before {
        content: "";
        border-radius: 10px;
        display: inline-block;
        width: 8px;
        height: 8px;
        border: 2px solid $sidebar-highlight;
        margin-right: 1em;
      }
      color: $text-default;
    }
  }
}
</style>
