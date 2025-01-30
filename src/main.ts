//原始的
/* 验证store
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
*/

//* 验证store
// main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount("#app");
