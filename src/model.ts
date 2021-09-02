import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

class CacheHitException<T = any> implements AxiosError<T> {
  public isAxiosError = false;
  public toJSON = () => ({
    message: "CacheHitException",
  });
  public name = "CacheHitException";
  public message = "CacheHitException";
  config: AxiosRequestConfig;
  public cachedResponse: T;
  constructor(value: T, config: AxiosRequestConfig) {
    this.config = config;
    this.cachedResponse = value;
  }
}

enum HttpHeaders {
  SER_AGENT = "user-agent",
  CACHE_CONTROL = "cache-control",
  IF_NONE_MATCH = "If-None-Match",
  ETAG = "etag",
  REFERRER = "referrer",
}

type AxiosInterceptorsCacheConfig = {
  etags: boolean;
  verbose: boolean;
  ttl: number;
};

export { CacheHitException, HttpHeaders, AxiosInterceptorsCacheConfig };
