<template>
  <nav id="navigation" :class="$route.name == 'post' ? 'navigation__post' : ''">
     <router-link
      tag="h1"
      :to="{name: 'home'}"
      v-if="$route.name != 'home'"
    >{{title}}</router-link>
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
import { BLOG_META } from "@/utils/constants";

const config = createConfig();
@Component
class Navigation extends Vue {
  public navList: _RouteConfig[] = Object.keys(config).map(k => ({
    ...config[k],
    name: k
  }));
  public title = BLOG_META.name
}
export default Navigation;
</script>
<style lang="scss">
@import "@/style/_theme.scss";

#navigation {
  padding: 0 30px;
  line-height: 64px;

  h1{
    display: inline-block;
    padding: 0;
    margin: 0;
    line-height: 1;
    cursor: pointer;
    user-select: none;
  }

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

  &.navigation__post{
    a.navigation__item:not(.router-link-active){
      color: white
    }
  }
}

</style>
