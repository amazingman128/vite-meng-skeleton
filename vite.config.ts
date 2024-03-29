import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {NaiveUiResolver} from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'

export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [NaiveUiResolver()],
        }),
        Components({
            resolvers: [NaiveUiResolver()],
        }),
        UnoCSS(),

    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
})
