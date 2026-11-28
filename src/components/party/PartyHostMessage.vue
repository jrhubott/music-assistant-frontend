<template>
  <Transition name="fade">
    <div
      v-if="message"
      role="status"
      class="absolute inset-x-0 top-[12%] mx-auto w-fit max-w-[80%] rounded-2xl bg-black/80 px-8 py-5 text-center text-[clamp(1.5rem,4vw,3.5rem)] font-bold text-white"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const MESSAGE_DURATION_MS = 15000;

const message = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;

const show = (text: string) => {
  clearTimeout(timer);
  message.value = text;
  timer = setTimeout(() => (message.value = ""), MESSAGE_DURATION_MS);
};

onBeforeUnmount(() => clearTimeout(timer));

defineExpose({ show });
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
