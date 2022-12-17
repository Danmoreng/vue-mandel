<script setup>
import MandelbrotContainer from "./components/MandelbrotContainer.vue";
import Controls from "@/components/Controls.vue";
</script>

<template>
  <header></header>
  <main>
    <MandelbrotContainer />
    <Controls></Controls>
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
</style>
