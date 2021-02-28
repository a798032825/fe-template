import axios, { AxiosRequestConfig, AxiosInstance } from 'axios'
import * as pathToRegexp from 'path-to-regexp'
import type { RequestParameter } from 'tsg-tgjz'
interface ReturnMessageArg {
  /**
   * 状态值  1为正常  0为失败  -1未经过验证
   * format: int32
   */
  code?: number
  /** 错误信息 */
  msg?: string
  /** 返回数据 */
  entity?: any
  /** 描述信息 */
  data?: any
}

export const parseUrl = (url: string, option?: RequestParameter): string => {
  if (option) {
    if (option.path) {
      Object.getOwnPropertyNames(option.path).forEach((k) => {
        option.path[k] = encodeURIComponent(String(option.path[k]))
      })
      url = pathToRegexp.compile(url)(option.path)
    }
  }
  return url
}
export function interceptRequest(
  url: string,
  option?: RequestParameter,
): [string, AxiosRequestConfig] {
  try {
    url = parseUrl(url, option)
  } catch (e) {
    throw new Error(e.message)
  }
  option = option || {}
  const requestOption: AxiosRequestConfig = {
    method: option.method || 'get',
  }
  if (option.header) {
    requestOption.headers = option.header
  }
  if (option.body) {
    requestOption.data = option.body
  }
  if (option.formData) {
    requestOption.data = option.formData
  }
  return [url, requestOption]
}
export const createRequester = (ax?: AxiosInstance) => {
  ax = ax || axios.create()
  return <T extends ReturnMessageArg>(
    apiUrl: string,
    param: RequestParameter,
    config?: AxiosRequestConfig,
  ) => {
    // eslint-disable-next-line prefer-const
    let [url, option] = interceptRequest(apiUrl, param)
    option = { url, ...option, ...config }
    return (ax!.request<T>(option) as unknown) as Promise<T['entity']>
  }
}

const request = axios.create({
  baseURL: 'http://localhost:3000',
})
request.interceptors.response.use((res) => {
  const data = res.data as ReturnMessageArg
  if (data.code != 1) {
    throw new Error(data.msg)
  }
  return data.entity
})

export const http = createRequester(request)
