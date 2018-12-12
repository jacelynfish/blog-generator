<template>
  <transition name="stt">
    <span
      id="scroll-to-top__btn"
      v-show="isShow"
      @click="() => {
      $emit('scroll-start')
      scrollToTop()}"
    >
      <font-awesome-icon icon="chevron-up"/>
    </span>
  </transition>
</template>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
class Scroll extends Vue {
  @Prop({ default: false }) public isShow!: boolean;
  @Prop({ default: false }) public isCancelled!: boolean;
  public scrollToTop() {
    let top = window.scrollY;

    if (top > 1) {
      requestAnimationFrame(() => {
        document.documentElement!.scrollBy(0, -top / 8);
        this.isCancelled ? this.$emit("scroll-finished") : this.scrollToTop();
      });
    } else {
      document.documentElement!.scrollTo(0, 0);
      this.$emit("scroll-finished");
    }
  }
}

export default Scroll;
</script>
<style lang="scss">
@import "@/style/_theme.scss";

$stt-btn-scale: 24px;
#scroll-to-top__btn {
  display: inline-block;
  width: $stt-btn-scale;
  height: $stt-btn-scale;
  position: fixed;
  bottom: $stt-btn-scale;
  right: $stt-btn-scale;
  background-color: $text-highlight;
  color: white;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }

  &.stt-enter-active,
  &.stt-leave-active {
    transition: opacity 0.3s, transform 0.5s ease-in-out;
  }
  &.stt-enter,
  &.stt-leave-to {
    opacity: 0;
    transform: translateY($stt-btn-scale);
  }
}
</style>
