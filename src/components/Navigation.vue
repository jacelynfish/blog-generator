<template>
  <nav id="navigation">
    <router-link
      class="navigation__item"
      v-for="link in navList"
      :to="link.path"
      :key="link.name"
      v-if="link.inNav"
    >{{link.title}}</router-link>
  </nav>
</template>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import createConfig, { _RouteConfig } from "../router/config";
let config = createConfig();
@Component
class Navigation extends Vue {
  public navList: _RouteConfig[] = Object.keys(config).map(k => ({
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

  a.navigation__item {
    margin: 0 8px;
    padding: 0 2px;
    font-weight: bold;
    color: $text-default;
    position: relative;

    &:hover {
      &:after {
        content: "";
        position: absolute;
        width: 6px;
        height: 6px;
        background-color: $text-highlight;
        border-radius: 3px;
        top: 50%;
        transform: translate(0.25em, -0.75em);
      }
    }
    &.router-link-exact-active {
      color: $text-highlight;
    }
  }
}
</style>
