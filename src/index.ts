import axios, { AxiosStatic, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface Options {
    config?: AxiosRequestConfig
}

const requestInterceptor = (config: AxiosRequestConfig): AxiosRequestConfig => config;
const responseInterceptor = (response: AxiosResponse): AxiosResponse => response;
const responseErrorInterceptor = (error: AxiosError): Promise<any> => Promise.reject();

const etagCacheFactory = function (_axios: AxiosStatic, options: Options) {
    const instance = options.config ? axios.create(options.config) : axios.create();
    instance.interceptors.request.use(requestInterceptor);
    instance.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
  
    return instance;
};

module.exports = etagCacheFactory