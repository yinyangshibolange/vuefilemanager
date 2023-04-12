<template>
  <div id="app">
    <fileManager />
  </div>
</template>

<script>
import fileManager from './components/file-manager.vue'

export default {
  name: 'App',
  components: {
      fileManager
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
