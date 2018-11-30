<template>
  <span id="scroll-to-top__btn" v-if="isShow" @click="scrollToTop"></span>
</template>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
class Scroll extends Vue {
  @Prop({ default: false }) public isShow!: boolean;
  public scrollToTop() {
    // let top = document.documentElement.scrollTop;
    // if (top > 1) {
    //   requestAnimationFrame(() => {
    //     document.documentElement.scrollBy(0, -top / 8);
    //     this.scrollToTop();
    //   });
    // } else {
    //   document.documentElement.scrollTo(0, 0);
    // }
  }
}

export default Scroll;
</script>
<style lang="scss">
@import "@/style/_theme.scss";

#scroll-to-top__btn {
  display: inline-block;
  width: 32px;
  height: 32px;
  position: fixed;
  bottom: 64px;
  right: 64px;
  background-color: $text-highlight;
  color: $post-title-color;
}
</style>
