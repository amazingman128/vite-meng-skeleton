import {createApp} from 'vue'
import {registerStore} from "@/store";

// 通用字体
import 'vfonts/Lato.css'
import 'normalize.css'
import '@unocss/reset/normalize.css'
import '@/styles/index.scss'
import App from '@/App.vue'
import router from '@/router/index'
import 'uno.css'
import {createPinia} from "pinia";

const app = createApp(App)
app.use(createPinia())
// 注册 Pinia
registerStore()
app.use(router)
app.mount('#app')
