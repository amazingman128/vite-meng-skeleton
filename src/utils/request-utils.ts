import axios from "axios";
import constants from "@/constants/constants";

// 创建请求服务
const requestService = axios.create({
    baseURL: constants.serverAPIUrl,
    timeout: constants.apiTimeOut,
    headers: {'Content-Type': 'application/json;charset=UTF-8'}
})

// 请求拦截器
requestService.interceptors.request.use((config: any) => {
        return config;
    },
    error => {

    }
)

// 响应拦截器
requestService.interceptors.response.use(response => {
        return response.data;
    }
    , error => {
    })

export default requestService