<template>
  <div>
    <div class="relative img-wrapper">
      <transition name="img">
        <img
          v-show="showImg"
          :src="animationSrc"
          class="mx-auto"
          alt=""
          @load="onLoadImg"
        />
      </transition>
      <div v-show="showLoading" class="loading"></div>
    </div>
    <div v-show="!showImg" class="text-center">
      <button
        type="button"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        @click.prevent="onClickDownload"
      >
        DOWNLOAD
      </button>
    </div>
    <div v-show="showImg" class="text-center mt-5">
      <a
        class="twitter-button text-white font-bold px-4 rounded-full"
        :href="twitterLoginURL"
        ><img src="~/static/twitter-logo.svg" alt="" /> Login</a
      >
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      showImg: false,
      loadedImg: false
    }
  },
  computed: {
    animationSrc(): string {
      if (!this.showImg || !this.$controller.animationFileName) {
        return ''
      }

      return `/animation-img/${this.$controller.animationFileName}`
    },
    showLoading(): boolean {
      return this.showImg && !this.loadedImg
    },
    twitterLoginURL(): string {
      if (!this.$controller.animationFileName) {
        return ''
      }

      return `/api/twitter/oauth/${this.$controller.animationFileName.replace(
        /\.gif$/,
        ''
      )}`
    }
  },
  mounted(): void {
    this.$store.dispatch('controller/disconnect')
  },
  methods: {
    onClickDownload(): void {
      this.showImg = true
    },
    onLoadImg(): void {
      this.loadedImg = true
    }
  }
})
</script>
<style scoped>
.img-wrapper {
  min-width: 300px;
  min-height: 300px;
}

.img-enter {
  opacity: 0;
}

.img-enter-to {
  opacity: 1;
}

.img-enter-active {
  transition: opacity 300ms linear;
}

.loading {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
}

.loading::before {
  content: '';
  display: block;
  width: 40px;
  height: 40px;
  border: 4px solid #0af;
  border-top-color: rgba(0, 170, 255, 0.2);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  border-radius: 999em;
  animation: loading 700ms linear 0s infinite;
}

@keyframes loading {
  to {
    transform: rotate(360deg);
  }
}

.twitter-button {
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  background-color: #1da1f2;
}

.twitter-button > img {
  width: 3em;
}
</style>
