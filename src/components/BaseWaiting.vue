<template>
  <div class="waiting flex items-center justify-center">
    <div class="waiting__inner">
      <span><slot>waiting</slot></span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({})
</script>

<style scoped>
.waiting {
  width: 200px;
  height: 200px;
  position: relative;
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.waiting::before,
.waiting::after,
.waiting__inner::before,
.waiting__inner::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  mix-blend-mode: darken;
  border-width: 5px;
  border-style: solid;
  border-radius: 48% 52% 50% 50% / 39% 57% 43% 61%;
}

.waiting::before {
  border-color: #90daff;
  animation: loop 1000ms linear 0s infinite normal forwards;
}

.waiting::after {
  border-color: #90ff99;
  animation: loop 700ms linear 0s infinite normal forwards;
}

.waiting__inner::before {
  border-color: #c490ff;
  animation: loop 900ms linear 0s infinite reverse forwards;
}

.waiting__inner::after {
  border-color: #fff890;
  animation: loop 1300ms linear 0s infinite normal forwards;
}

span {
  position: relative;
}

span:after {
  content: '.';
  position: absolute;
  left: 100%;
  animation: progress 700ms linear 0s infinite normal forwards;
}

@keyframes loop {
  0% {
    border-radius: 48% 52% 50% 50% / 39% 57% 43% 61%;
    transform: rotate(0);
  }
  25% {
    border-radius: 48% 52% 42% 58% / 49% 51% 49% 51%;
  }
  50% {
    border-radius: 47% 53% 61% 39% / 54% 47% 53% 46%;
  }
  75% {
    border-radius: 63% 37% 55% 45% / 49% 55% 45% 51%;
  }
  100% {
    border-radius: 48% 52% 50% 50% / 39% 57% 43% 61%;
    transform: rotate(360deg);
  }
}

@keyframes progress {
  0% {
    content: '.';
  }
  25% {
    content: '..';
  }
  50% {
    content: '...';
  }
  75% {
    content: '....';
  }
  100% {
    content: '.';
  }
}
</style>
