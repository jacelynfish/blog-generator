<template>
  <div id="app">
    <navigation></navigation>
    <router-view/>
    <custom-footer></custom-footer>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Navigation from "@/components/Navigation.vue";
import CustomFooter from "@/components/Footer.vue";
import ScrollToTop from "@/components/ScrollToTop.vue";
@Component({
  components: { Navigation, CustomFooter }
})
class App extends Vue {}

export default App;
</script>


<style lang="scss">
@import "@/style/_theme.scss";
@import "@/style/common.scss";

body {
  padding: 0;
  margin: 0;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: $text-default;
  min-height: 100vh;
  position: relative;
}
ul {
  padding: 0;
  li {
    list-style: none;
    padding: 0;
  }
}
a {
  text-decoration: none;
  &:visited,
  &:hover,
  &:focus,
  &:active {
    text-decoration: none;
  }
}
</style>
