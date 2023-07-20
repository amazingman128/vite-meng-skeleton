import {defineStore} from 'pinia'

export const userStore = defineStore('userStore', {
    state: () => ({
        // 用户信息
        user: {
            id: '',
            username: '',
            avatar: ''
        },
        // 权限列表
        authorityList: [],
        // 登录token
        token: ''
    }),
    actions: {
        setUser(val: any) {
            this.user = val
        },
    }
})