import {createApp} from 'vue'
import ElementPlus from 'element-plus'
import CodeBlock from 'vue3-code-block';
import 'element-plus/dist/index.css'
import 'normalize.css'
import '@unocss/reset/normalize.css'
import '@/styles/index.scss'
import App from '@/App.vue'
import router from '@/router/index'
import 'uno.css'

const app = createApp(App)
app.component('CodeBlock', CodeBlock)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
