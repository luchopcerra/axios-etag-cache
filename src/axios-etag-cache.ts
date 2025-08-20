
import { Cache } from "./cache";
import { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosRequestHeaders } from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

import {
  AxiosInterceptorsCacheConfig,
  CacheHitException,
  HttpHeaders,
} from "./model";

export class AxiosETAGCache {
  private cache: Cache;

  constructor() {
    this.cache = Cache.getInstance();
  }

  public getInterceptors() {
    return [
      this.requestInterceptor.bind(this),
      this.requestErrorInterceptor.bind(this),
      this.responseInterceptor.bind(this),
      this.responseErrorInterceptor.bind(this),
    ];
  }

  private isCacheableMethod(config: AxiosRequestConfig): boolean {
    return config.method
      ? ["GET", "HEAD"].includes(config.method.toUpperCase())
      : false;
  }

  private getKey(config: AxiosRequestConfig) {
    const params = config.params ? JSON.stringify(config.params) : "";
    const data = config.data ? JSON.stringify(config.data) : "";
    return `${config.url}${params}${data}`;
  }

  private getCacheByAxiosConfig(config: AxiosRequestConfig) {
    return Cache.get(this.getKey(config));
  }

  private requestInterceptor(config: AxiosRequestConfig) {
    if (this.isCacheableMethod(config)) {
      const key = this.getKey(config);
      const cache = Cache.get(key);
      if (cache) {
        const maxAge: number = cache.maxAge;
        const timestamp = cache.timestamp;
        const threshold = dayjs(timestamp);
        threshold.add(maxAge, "s");
        // thow error here to cancel request and serve cached value
        if (dayjs().isBetween(timestamp, threshold, "s")) {
          throw new CacheHitException(cache.value, config as any);
        } else {
          if (!config.headers) {
            config.headers = {};
          }
          config.headers[HttpHeaders.IF_NONE_MATCH] = cache.etag;
        }
      }
    }
    return config;
  }

  private requestErrorInterceptor(exception: CacheHitException) {
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
  }

  private responseInterceptor(response: AxiosResponse) {
    if (this.isCacheableMethod(response.config)) {
      const timestamp = dayjs();
      const etag = response.headers[HttpHeaders.ETAG] || "no-etag";
      const maxAgeHeader = response.headers[HttpHeaders.CACHE_CONTROL];
      let maxAge: number;
      try {
        maxAge = parseInt(maxAgeHeader.split("=")[1], 10);
      } catch (err) {
        maxAge = 0;
      }
      Cache.set(
        this.getKey(response.config),
        etag,
        maxAge,
        timestamp,
        response.data
      );
    }
    return response;
  }

  private responseErrorInterceptor(error: AxiosError) {
    const config = error.response?.config;
    if (config && this.hasHeaders(config)) {
      const cache = this.getCacheByAxiosConfig(config);
      if (cache && error.response && error.response.status === 304) {
        const response = error.response;
        response.status = 200;
        response.data = cache.value;
        return Promise.resolve(response);
      }
    }
    return Promise.reject(error);
  }

  private hasHeaders(config: AxiosRequestConfig): config is AxiosRequestConfig & { headers: AxiosRequestHeaders } {
    return !!config.headers;
  }
}
