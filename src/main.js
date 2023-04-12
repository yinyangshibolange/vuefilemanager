import Vue from 'vue'
import App from './App.vue'
import hyContextmenu from "hy-contextmenu"

Vue.config.productionTip = false
Vue.use(hyContextmenu)

new Vue({
  render: h => h(App),
}).$mount('#app')
