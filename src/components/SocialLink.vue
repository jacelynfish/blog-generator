<template>
  <ul id="social">
    <li class="social__item" v-for="(item, key) in links" :key="key">
      <a :href="item.url" target="_blank" rel="noopener noreferrer">{{item.name}}</a>
    </li>
  </ul>  
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

interface SocialItem {
  name: string;
  url: string;
  icon?: string;
}

@Component
class SocialLink extends Vue {
  public links: {
    [propName: string]: SocialItem;
  } = {
    weibo: {
      name: '微博',
      url: 'https://weibo.com/jacelynfish'
    },
    github: {
      name: 'GitHub',
      url: 'https://github.com/jacelynfish'
    },
    codepen: {
      name: 'CodePen',
      url: 'https://codepen.io/jacelynfish'
    }
  };
}

export default SocialLink;
</script>

<style lang="scss">
@import '@/style/_theme.scss';

#social {
  margin: 0;
  text-align: center;

  .social__item {
    display: inline-block;
    margin-right: 16px;
    &:last-child {
      margin-right: 0;
    }
    a {
      display: inline-block;
      box-sizing: border-box;
      border: 1px solid $sidebar-highlight;
      width: 64px;
      height: 64px;
      border-radius: 32px;

      font-size: 0;
      background-color: transparent;
      transition: all 0.5s;

      &:hover {
        transition: all 0.5s;
        border-color: transparent;
        background-color: $post-title-color;
      }
    }
  }
}
</style>
