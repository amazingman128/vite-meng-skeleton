import Cookies from '@jcstdio/jc-utils'
import {TOKEN_KEY} from "@/constants/constants";

// @ts-ignore
const cookies: Cookies = new Cookies();

/**
 * 获取管理端Token
 */
const getAdminToken = () => {
    return cookies.get(TOKEN_KEY)
}

/**
 * 设置管理端token
 * @param token token值
 */
const setAdminToken = (token: string) => {
    return cookies.set(TOKEN_KEY, token)
}

/**
 * 移除Token
 */
const remoteAdminToken = () => {
    return cookies.remove(TOKEN_KEY)
}

export default {
    getAdminToken,
    setAdminToken,
    remoteAdminToken
}