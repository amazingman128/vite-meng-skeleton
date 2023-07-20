import requestService from "@/utils/request-utils";

export const useCaptchaApi = ()=>{
    return requestService.get('')
}

export const useAccountLoginApi = (data: any) => {
    return requestService.post('/sys/auth/login', data)
}