<template>
  <nav id="navigation">
    <router-link
      v-for="link in navList"
      :to="link.path"
      :key="link.name"
      v-if="link.inNav"
    >{{link.title}}</router-link>
  </nav>
</template>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import config, { RouteConfig } from "../router/config";

@Component
class Navigation extends Vue {
  public navList: Array<RouteConfig> = Object.keys(config).map(k => ({
    ...config[k],
    name: k
  }));
}
export default Navigation;
</script>
<style lang="scss">
@import "@/style/_theme.scss";

#navigation {
  padding: 0 30px;
  line-height: 64px;
  a {
    margin: 0 8px;
    padding: 0 2px;
    font-weight: bold;
    color: $text-default;
    &.router-link-exact-active {
      color: $text-highlight;
    }
  }
}
</style>
