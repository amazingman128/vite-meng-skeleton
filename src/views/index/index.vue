<template>
  <n-layout has-sider class="w-screen h-screen">
    <div class="w-30 bg-gray-50 ">
      <n-avatar
          size="large"
          src="/tmp/logo-tmp.png"
          class="m-t-4 m-l-10"
      />
      <div class="rounded-lg border-solid	 border-2	border-red-400 main-menu-item bg-blue-100">
        <n-avatar
            size="small"
            src="/tmp/logo-tmp.png"
            class="m-l-10"/>
        <span class=" block w-full text-center">系统</span>
      </div>
      <div class="rounded-lg border-solid	 border-2	border-red-400 main-menu-item bg-blue-100">
        <n-avatar
            size="small"
            src="/tmp/logo-tmp.png"
            class="m-t-4 m-l-10"/>
        <span class=" block w-full text-center">资源</span>
      </div>
    </div>
    <n-layout-sider
        position="static"
        collapse-mode="width"
        :collapsed-width="120"
        :width="240"
        show-trigger="arrow-circle"
        content-style="padding: 24px;"
        bordered
        :on-update:collapsed="layoutSideBarChangeHandler"
    >
      <n-gradient-text class="w-full text-center text-lg font-bold	p-b-5 divide-y"
                       gradient="linear-gradient(90deg, red 0%, green 50%, blue 100%)"
      >
        NamelessAdmin
      </n-gradient-text>
      <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :render-label="renderMenuLabel"
          :render-icon="renderMenuIcon"
          :expand-icon="expandIcon"
      />
    </n-layout-sider>
    <n-layout-content content-style="padding: 24px;">
      平山道
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

<style scoped >
.main-menu-item{
  position: relative;
  padding-top: 10px;
  margin: 0 auto;
  width: 80%;
  margin-top:10px;
}
.main-menu-item:before{
  content: "";
  opacity: 0.9;
  left: -10%;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: indianred;
  box-shadow: 0 0 0 1px black;
  transition: all .3s;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
</style>