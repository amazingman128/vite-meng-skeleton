import {createApp} from 'vue'
import CodeBlock from 'vue3-code-block';
// 通用字体
import 'vfonts/Lato.css'
import 'normalize.css'
import '@unocss/reset/normalize.css'
import '@/styles/index.scss'
import App from '@/App.vue'
import router from '@/router/index'
import 'uno.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
