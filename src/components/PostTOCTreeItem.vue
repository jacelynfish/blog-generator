<template>
  <li class="post__toc-item" :data-level="model.level">
    <a :href="'#'+model.anchor">{{model.content}}</a>
    <ul v-if="Object.keys(model.children).length" class="post__toc-inner-wrapper">
      <tree-item v-for="(child, key) in model.children" :model="child" :key="key"></tree-item>
    </ul>
  </li>
</template>
<script>
export default {
  data: function() {
    return {};
  },
  name: "tree-item",
  props: ["model"]
};
</script>

