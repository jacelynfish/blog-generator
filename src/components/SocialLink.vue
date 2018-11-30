<template>
  <ul id="social">
    <li class="social__item" v-for="(item, key) in links" :key="key">
      <a :href="item.url" target="_blank" rel="noopener noreferrer">
        <font-awesome-icon :icon="['fab', key]"/>
      </a>
    </li>
  </ul>
</template>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { SocialItem, SOCIAL_LINKS } from "@/utils/constants";

@Component
class SocialLink extends Vue {
  public readonly links: {
    [propName: string]: SocialItem;
  } = SOCIAL_LINKS;
}

export default SocialLink;
</script>

<style lang="scss">
@import "@/style/_theme.scss";

#social {
  margin: 0;
  text-align: center;

  .social__item {
    display: inline-block;
    @include list-margin(8px);
    a {
      display: inline-block;
      box-sizing: border-box;
      // border: 1px solid $sidebar-highlight;
      width: 64px;
      height: 64px;
      border-radius: 32px;
      font-size: 3em;
      background-color: transparent;
      transition: all 0.5s;

      .svg-inline--fa {
        vertical-align: middle;
      }

      &:hover {
        transition: all 0.5s;
        // border-color: transparent;
        background-color: $post-title-color;
        color: white;
      }
    }
  }
}
</style>
