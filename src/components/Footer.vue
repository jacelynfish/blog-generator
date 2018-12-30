<template>
  <footer id="footer">
    
    <social-link></social-link>
    <p class="footer__power">Powered with
      <font-awesome-icon icon="heart"></font-awesome-icon>
      {{" "}}by
      <router-link to="/">Jacelyn</router-link>
    </p>
  </footer>
</template>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import SocialLink from "./SocialLink.vue";
import { FriendItem, FRIEND_LIST } from "@/utils/constants";

@Component({
  components: {
    SocialLink
  }
})
class Footer extends Vue {
  public readonly friendList = FRIEND_LIST;
}

export default Footer;
</script>

<style lang="scss">
@import "@/style/_theme.scss";

#footer {
  font-size: 14px;
  margin: 64px 0 32px;
  text-align: center;
  // .footer__friends {
  //   padding: 0 10%;
  //   text-align: left;
  //   li {
  //     display: inline-block;
  //     @include list-margin(8px);
  //   }
  // }
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
