<template>
  <main class="offline">offline!</main>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
// import { AsyncData } from "../types/index";
import { State } from "vuex-class";

@Component({
  beforeRouteLeave(to, from, next) {
    next();
  }
})
class Offline extends Vue {}

export default Offline;
</script>
<style lang="scss">
@import "@/style/common.scss";
</style>
