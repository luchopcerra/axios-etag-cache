import { Cache } from "./cache";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import moment from "moment";
import {
  AxiosInterceptorsCacheConfig,
  CacheHitException,
  HttpHeaders,
} from ".";
const isCacheableMethod = (config: AxiosRequestConfig): boolean => {
  return config.method
    ? ["GET", "HEAD"].includes(config.method.toUpperCase())
    : false;
};

const getKey = (config: AxiosRequestConfig) => config.url || "";

const getCacheByAxiosConfig = (config: AxiosRequestConfig) =>
  Cache.get(getKey(config));

// Interceptors !!!  -------------------------
const requestInterceptor = (config: AxiosRequestConfig) => {
  if (isCacheableMethod(config)) {
    const key = getKey(config);
    const cache = Cache.get(key);
    if (cache) {
      const maxAge: number = cache.maxAge;
      const timestamp = cache.timestamp;
      const threshold = moment(timestamp);
      threshold.add(maxAge, "s");
      // thow error here to cancel request and serve cached value
      if (moment().isBetween(timestamp, threshold, "s")) {
        throw new CacheHitException(cache.value, config);
      } else {
        config.headers[HttpHeaders.IF_NONE_MATCH] = cache.etag;
      }
    }
  }
  return config;
};
const requestErrorInterceptor = (exception: CacheHitException) => {
  switch (exception.constructor) {
    case CacheHitException:
      const msg = "Retrieved from node cache";
      return Promise.resolve({
        data: exception.cachedResponse,
        status: 200,
        statusText: msg,
        config: exception.config,
      });
    default:
      const errorMsg = `Error calling: ${exception.config.url}. ${exception.message}`;
      console.log(errorMsg);
      return Promise.reject(exception);
  }
};
const responseInterceptor = (response: AxiosResponse) => {
  if (isCacheableMethod(response.config)) {
    const timestamp = moment();
    const etag = response.headers[HttpHeaders.ETAG] || "no-etag";
    const maxAgeHeader = response.headers[HttpHeaders.CACHE_CONTROL];
    let maxAge: number;
    try {
      maxAge = parseInt(maxAgeHeader.split("=")[1], 10);
    } catch (err) {
      maxAge = 0;
    }
    Cache.set(getKey(response.config), etag, maxAge, timestamp, response.data);
  }
  return response;
};
const responseErrorInterceptor = (error: AxiosError) => {
  const cache = error.response
    ? getCacheByAxiosConfig(error.response.config)
    : undefined;
  if (cache && error.response && error.response.status === 304) {
    const response = error.response;
    response.status = 200;
    response.data = cache.value;
    return Promise.resolve(response);
  } else {
    return Promise.reject(error);
  }
};

// end  -------------------------

const AxiosInterceptorsCache = ({
  verbose = false,
  etags = true,
  ttl = 30, //30m
}: AxiosInterceptorsCacheConfig) => {
  return [
    requestInterceptor,
    requestErrorInterceptor,
    responseInterceptor,
    responseErrorInterceptor,
  ];
};

export default AxiosInterceptorsCache;
