<template>
  <footer id="footer">
    <social-link></social-link>
    <p class="footer__power">Powered by <router-link to="/">Jacelyn</router-link></p>
  </footer>  
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import SocialLink from './SocialLink.vue';

@Component({
  components: {
    SocialLink
  }
})
class Footer extends Vue {}

export default Footer;
</script>

<style lang="scss">
@import '@/style/_theme.scss';

#footer {
  font-size: 14px;
  margin: 64px 0 32px;
  text-align: center;
  .footer__power {
    line-height: 2;
    a {
      color: $post-title-color;
      &:hover {
        text-decoration: underline currentColor;
      }
    }
  }
}
</style>
