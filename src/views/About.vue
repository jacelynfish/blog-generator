<template>
  <main class="about">
    <details>
      <summary>About</summary>
      <p>关于我</p>
    </details>
    <details open>
      <summary>Friends</summary>
      <ul class="about__friends">
        <li v-for="(friend, name) in friendList" :key="name" >
          <a :href="friend.url" rel="noopener noreferrer" 
              target="_blank" 
              @mouseenter="handleRippleStart($event, name)"
              @mouseleave="ripple.current = `_${ripple.current}`" >
            <img :src="`https://resource.jacelyn.fish/blog/about/avatar/${name}.jpg`" :alt="name" class="about__friends-avatar">
            <p class="about__friends-title">{{friend.title}}</p>
            <span class="about__friends-desc" v-if="friend.desc">{{friend.desc}}</span>
          </a>
          <span class="ripple" v-if="name == ripple.current" :style="{left: `${ripple.x}px`, top: `${ripple.y}px`}"></span>
        </li>
      </ul>
    </details>
  </main>
</template>
<style lang="scss">
</style>


<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { FRIEND_LIST } from "@/utils/constants";
@Component
class About extends Vue {
  public readonly friendList = FRIEND_LIST;
  public ripple = {
    current: '',
    x: -1000,
    y: -1000
  }
  private rippleTimer = null

  public handleRippleStart(e: MouseEvent, name:string) {
    this.ripple = {
      current:name,
      x: e.offsetX,
      y: e.offsetY
    }

    console.log(e.offsetX, e.offsetY)
  }
}

export default About;
</script>

<style lang="scss">
@import "@/style/common.scss";
@keyframes ripple-show {
  0% {
    transform: translate(-50%, -50%) scale(0);
      opacity: 0;

  }
  50% {
    transform: translate(-50%, -50%) scale(1);
      opacity: 0.3  ;

  }
  100% {
    transform:  translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}
.ripple{
  position: absolute;
  padding: 50%;
  background-color: $sidebar-highlight;
  opacity: 0;
  transform: translate(-50%, -50%);
  border-radius:100%;
  pointer-events: none;
  animation: ripple-show 0.5s linear;
}
.about{
  details{
    ::-webkit-details-marker{
      display: none;
    }
    ::-moz-list-bullet{
      font-size: 0;
    }
    &[open] summary{
      color: $text-highlight;
    }

    margin: 8em 0;
    &:first-child{
      margin: 0;
    }
  }

  summary{
    text-transform: uppercase;
    outline: 0;
    text-align: center;
    user-select: none;
    font-weight: bold;
    cursor: pointer;
  }

  .about__friends{
    li{
      overflow:hidden;
      position: relative;
      display: inline-block;
      width: 48%;
      box-sizing: border-box;
      margin: 24px 0;
      padding-right: 12px;
      box-shadow: 0px 8px 20px transparentize($dark-background, 0.8);

      a{
        display:block;
        @include clearfix;
      }
      &:nth-child(odd){
        margin-right: 4%;
      }
    }
  }
  .about__friends-title{
    font-weight: bolder;
    margin: 0;
    padding-top: 1em;
  }
  .about__friends-avatar{
    width: 120px;
    height: 120px;
    float:left;
    margin-right: 12px;
  }
  .about__friends-desc{
    font-size: 12px;
    color: $text-default;
  }
}
</style>

