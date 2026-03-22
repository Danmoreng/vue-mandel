<script setup>
import { computed } from "vue";
import MandelbrotContainer from "./components/MandelbrotContainer.vue";
import Controls from "@/components/Controls.vue";
import { useStore } from "@/store/store";

const store = useStore();
const isUnsupportedBrowser = computed(
  () => store.capabilitiesChecked && store.unsupportedBrowser
);

function toggleControls() {
  store.showControls = !store.showControls;
}

function reset() {
  store.resetView();
}
</script>

<template>
  <button class="resetButton" v-on:click="reset">Reset</button>
  <button class="controlsButton" v-on:click="toggleControls">
    Show/Hide Controls
  </button>
  <main>
    <MandelbrotContainer />
    <Controls></Controls>
    <section v-if="isUnsupportedBrowser" class="unsupportedBanner">
      <h2>Browser Unsupported</h2>
      <p>{{ store.rendererError || "WebGL2 is required to run this app." }}</p>
    </section>
  </main>
</template>

<style>
html,
body {
  touch-action: none;
  background: #111;
  margin: 0;
}
main {
  display: flex;
}
.resetButton {
  position: absolute;
  top: 15px;
  left: 15px;
}
.controlsButton {
  position: absolute;
  z-index: 100;
  top: 15px;
  right: 15px;
}
.unsupportedBanner {
  position: absolute;
  inset: 80px 12px auto;
  z-index: 150;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(12, 12, 12, 0.92);
  color: white;
}
.unsupportedBanner h2,
.unsupportedBanner p {
  margin: 0;
}
.unsupportedBanner p {
  margin-top: 8px;
}
</style>
