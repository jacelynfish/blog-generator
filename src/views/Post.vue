<template>
  <div v-scroll="handleScroll">
    <header class="post__title" :data-bg-url="post.background_url">
      <h1>
        {{post.title}}
        <span class="post__title-date">
          Published at {{displayDate(post.date)}} in
          <ul class="post__title-categories">
            <li v-for="(cat, idx) of post.categories" :key="idx">{{cat}}</li>
          </ul>
        </span>
        <ul class="post__title-tags">
          <li v-for="(tag, idx) of post.tags" :key="idx">{{tag}}</li>
        </ul>
      </h1>
    </header>
    <main class="post" ref="postContent">
      <post-toc :toc="this.post.toc"></post-toc>
      <article class="post__content" v-html="post.content"></article>
    </main>

    <scroll-to-top
      :is-cancelled="isCancelled"
      :is-show="isScrollToTop"
      v-on:scroll-start="isScrollStart = true"
      v-on:scroll-finished="handleScrollFinished"
    ></scroll-to-top>
  </div>
</template>
<script lang="ts">
import "highlight.js/styles/zenburn.css";

import { Component, Vue, Mixins } from "vue-property-decorator";
import { AsyncData, PostData, PostMeta } from "../types/index";
import { State, namespace } from "vuex-class";

import ScrollToTop from "@/components/ScrollToTop.vue";
import PostToc from "@/components/PostToc.vue";

import moment from "moment";
import { BLOG_META } from "@/utils/constants";
const post = namespace("post");

@Component({
  components: {
    ScrollToTop,
    PostToc
  }
})
class PostContainer extends Vue {
  public static asyncData: AsyncData = ({ store, baseURL, route }) => {
    return store.dispatch("post/GET_POST", {
      title: route.params.title,
      baseURL
    });
  };

  public isScrollStart: boolean = false;
  public isCancelled: boolean = false;
  public isScrollToTop: boolean = false;
  @State(state => state.post) public post!: PostData;

  public mounted() {
    const title = `${this.post.title} | ${BLOG_META.name}`;
    if (document.title != title) { document.title = title; }

    const content: Element = this.$refs.postContent as Element
    createCodeCopy(
      { ...this.post, permalink: `${location.href}` },
      content.querySelectorAll(".post-code__block")
    );
  }
  public handleScroll(e: Event) {
    if (this.isScrollStart) {
      this.isCancelled = true;
      e.preventDefault();
      return false;
    } else {
      this.getIsScrollTop();
    }
  }

  public getIsScrollTop() {
    const isShow = window.scrollY > window.innerHeight * 1.5;
    if (isShow != this.isScrollToTop) {
      this.isScrollToTop = isShow;
    }
  }

  public handleScrollFinished() {
    this.getIsScrollTop();
    this.isCancelled = false;
    this.isScrollStart = false;
  }

  public displayDate(date: string) {
    return moment(date).format("LLL");
  }
}

const onCopyClick = (e: Event, code: Node) => {
  window.getSelection().removeAllRanges();

  const range = document.createRange();
  range.selectNodeContents(code);

  window.getSelection().addRange(range);
  const res = document.execCommand("copy");
  if (res) {
    console.log("复制成功");
  }
  window.getSelection().removeAllRanges();
};

const onCodeCopy = (e: Event, meta: PostMeta) => {
  e.preventDefault();
  const clipboardData = (e as ClipboardEvent).clipboardData;
  const text = window.getSelection().toString();
  clipboardData.setData(
    "text/plain",
    text +
      `\n
      \n来源：${BLOG_META.name} - ${meta.title}\n链接：${
        meta.permalink
      }\n著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。`
  );
};

function createCodeCopy(meta: PostData, codeBlocks: NodeList) {
  const btn = (code: Node) => {
    const b = document.createElement("button");
    b.classList.add("post-code__copy-btn");
    b.addEventListener("click", (e: Event) => onCopyClick(e, code));
    return b;
  };
  if (document.queryCommandSupported("copy")) {
    codeBlocks.forEach((block, idx) => {
      const code = block.firstChild!;
      code.addEventListener("copy", (e: Event) => onCodeCopy(e, meta));
      block.appendChild(btn(code));
    });
  }
}

export default PostContainer;
</script>

<style lang="scss">
@import "@/style/post.scss";

.post {
  @media (min-width: 960px) {
    width: 60%;
    margin-left: 30%;
  }
}
.post__title {
  text-align: center;
  padding: 12em 8%;
  margin: -64px 0 64px;
  background: $ins-gradient;
  color: white;
  h1 {
    margin: 0;
    display: inline-block;
    text-align: left;
  }
  .post__title-date {
    font-size: 14px;
    font-weight: normal;
    display: block;
    line-height: 2.5;
  }
  .post__title-categories,
  .post__title-tags {
    display: inline;
    li {
      display: inline-block;
      margin-right: 6px;
      &:last-child {
        margin-right: 0px;
      }
    }
  }
  .post__title-tags {
    margin: 0px;
    font-size: 14px;
    line-height: 1.8;
    font-weight: normal;
    li {
      cursor: pointer;
      margin-right: 8px;
      padding: 2px 8px;
      border-radius: 32px;
      border: 1px solid fade-out(white, 0.3);
      transition: all 0.5s;

      &:hover {
        border-color: transparent;
        background-color: white;
        color: $post-title-color;
      }
    }
  }
}
.post__content-anchor {
  margin-right: 8px;
}
.post-code__block {
  position: relative;
  &:hover {
    .post-code__copy-btn {
      transition: opacity 0.5s;
      opacity: 1;
    }
  }
}
.post-code__copy-btn {
  transition: opacity 0.5s;
  opacity: 0;
  color: transparentize(white, 0.4);
  border: none;
  background-color: currentColor;
  mask: url("~@/assets/copy-regular.svg") no-repeat center;
  cursor: pointer;
  height: 20px;
  width: 20px;
  position: absolute;
  top: 10px;
  right: 10px;
  &:hover {
    color: $text-highlight;
  }
}
</style>

