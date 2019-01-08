<template>
  <ul class="post__toc">
    <tree-item v-for="(child, key) in toc" :model="child" :key="key"></tree-item>
  </ul>
</template>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { PostTOC } from "../types/index";
import TreeItem from "./PostTOCTreeItem.vue";

@Component({
  components: {
    TreeItem
  }
})
class PostTOCWrapper extends Vue {
  @Prop() private toc: PostTOC[];
}

export default PostTOCWrapper;
</script>

<style lang="scss">
@import "@/style/_theme.scss";
.post__toc {
  position: sticky;
  font-size: 12px;
  width: max-content;
  max-width: 36%;
  top: 2em;
  margin: 0px -100% 0px -45%;
  float: left;
  line-height: 1.6;

  @media (max-width: 960px) {
    display: none;
  }
}
.post__toc-inner-wrapper {
  counter-reset: post-toc-chapter;
}
.post__toc-item {
  counter-increment: post-toc-chapter;
  &::before {
    content: counters(post-toc-chapter, ".");
    margin-right: 0.5em;
    opacity: 0.5;
  }
}
</style>
