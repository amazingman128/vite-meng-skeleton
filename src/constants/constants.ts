// 管理端-Token关键字
export const TOKEN_KEY = "AdminToken";

export default {
    // API地址
    serverAPIUrl: import.meta.env.VITE_SERVER_API_URL,
    // websocket 服务地址
    webSocketAPIUrl: import.meta.env.VITE_WEBSOCKET_API_URL,
    // axios 请求超时时间
    apiTimeOut: 10000,
}