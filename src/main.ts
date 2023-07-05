import {createApp} from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'normalize.css'
import '@/styles/index.scss'
import App from '@/App.vue'
import router from '@/router/index'
// main.ts
import 'virtual:uno.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
