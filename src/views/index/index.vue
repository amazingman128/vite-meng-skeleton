<template>
  <n-layout has-sider class="w-screen h-screen bg-gray-100">
    <div class="w-30 bg-gray-50 h-screen ">
      <n-avatar
          size="large"
          src="/tmp/logo-tmp.png"
          class="main-sidebar-logo block"
      />
      <n-scrollbar>
        <div
            class="rounded-lg border-solid	 border-1	 main-sidebar-menu-item m-auto flex flex-flex-col m-t-2">
          <n-avatar
              size="small"
              src="/tmp/logo-tmp.png"
              class="block m-auto "/>
          <span class=" block  text-center p-t-2">系统</span>
        </div>
        <div
            class="rounded-lg border-solid	 border-1	 main-sidebar-menu-item m-auto flex flex-flex-col m-t-2">
          <n-avatar
              size="small"
              src="/tmp/logo-tmp.png"
              class="block m-auto "/>
          <span class=" block  text-center p-t-2">参数</span>
        </div>

      </n-scrollbar>
    </div>

    <n-layout-sider
        position="static"
        collapse-mode="width"
        :collapsed-width="80"
        :width="220"
        show-trigger="arrow-circle"
        content-style="padding: 10px;"
        bordered
        :on-update:collapsed="layoutSideBarChangeHandler"
        class=""
    >
      <n-scrollbar>
        <n-gradient-text class="w-full text-center text-lg font-black	p-b-5 "
                         gradient="linear-gradient(90deg, black 0%, red 50%, blue 100%)"
        >
          NamelessAdmin
        </n-gradient-text>
        <n-menu
            accordion
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="menuOptions"
            :render-label="renderMenuLabel"
            :render-icon="renderMenuIcon"
            :expand-icon="expandIcon"
            class=" "
        />
      </n-scrollbar>

    </n-layout-sider>
    <n-layout-content class="m-l-3 m-r-3">
      <n-scrollbar>
        kdljfdks
      </n-scrollbar>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import {BookmarkOutline, CaretDownOutline} from '@vicons/ionicons5'
import type {MenuOption} from 'naive-ui'
import {NIcon} from 'naive-ui'
import {ref, h, type Ref} from "vue";


const layoutSideBarChangeHandler = function (collapsedOpt: boolean) {
  console.log(collapsedOpt);
  collapsed.value = collapsedOpt
}

const collapsed: Ref<boolean> = ref(false)

const menuOptions: MenuOption[] = [
  {
    label: '驾驶舱',
    key: 'hear-the-wind-sing',
    href: 'https://baike.baidu.com/item/%E4%B8%94%E5%90%AC%E9%A3%8E%E5%90%9F/3199'
  },
  {
    label: '系统管理',
    key: 'pinball-1973',
    children: [
      {
        label: '鼠',
        key: 'rat'
      }
    ]
  },
  {
    label: '支付管理',
    key: 'a-wild-sheep-chase',
  },
  {
    label: '订单管理',
    key: 'dance-dance-dance',
    children: [
      {
        type: 'group',
        label: '人物',
        key: 'people',
        children: [
          {
            label: '叙事者',
            key: 'narrator'
          },
          {
            label: '羊男',
            key: 'sheep-man'
          }
        ]
      },
      {
        label: '饮品',
        key: 'beverage',
        children: [
          {
            label: '威士忌',
            key: 'whisky',
            href: 'https://baike.baidu.com/item/%E5%A8%81%E5%A3%AB%E5%BF%8C%E9%85%92/2959816?fromtitle=%E5%A8%81%E5%A3%AB%E5%BF%8C&fromid=573&fr=aladdin'
          }
        ]
      },
      {
        label: '食物',
        key: 'food',
        children: [
          {
            label: '三明治',
            key: 'sandwich'
          }
        ]
      },
      {
        label: '过去增多，未来减少',
        key: 'the-past-increases-the-future-recedes'
      }
    ]
  }
]

const renderMenuLabel = function (option: MenuOption) {
  if ('href' in option) {
    return h(
        'a',
        {href: option.href, target: '_blank'},
        option.label as string
    )
  }
  return option.label as string
}
const renderMenuIcon = function (option: MenuOption) {
  // 渲染图标占位符以保持缩进
  if (option.key === 'sheep-man') return true
  // 返回 falsy 值，不再渲染图标及占位符
  if (option.key === 'food') return null
  return h(NIcon, null, {default: () => h(BookmarkOutline)})
}
const expandIcon = function () {
  return h(NIcon, null, {default: () => h(CaretDownOutline)})
}

</script>

<style scoped lang="scss">
.main-sidebar-logo {
  margin: 0 auto;
  margin-top: 10px;
}

.main-sidebar-menu-item {
  background-color: rgba(45, 140, 240, 0.3);
  border-color: rgba(45, 140, 240, 0.1);
  display: block;
  position: relative;
  padding-top: 10px;
  width: 70%;
  margin-top: 10px;
}

.main-sidebar-menu-item:before {
  content: "";
  opacity: 0.9;
  left: -10%;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: rgba(45, 140, 240, 1);
  box-shadow: 0 0 0 1px rgba(45, 140, 240, 0.8);
  transition: all .3s;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
</style>