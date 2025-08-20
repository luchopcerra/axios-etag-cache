# Axios ETag Cache

[![npm version](https://badge.fury.io/js/axios-etag-cache.svg)](https://badge.fury.io/js/axios-etag-cache)

A simple and effective ETag-based caching interceptor for Axios.

## Installation

```bash
npm install axios-etag-cache
```

## Usage

```typescript
import axios from "axios";
import { AxiosETAGCache } from "axios-etag-cache";

// Create a new instance of the cache
const cache = new AxiosETAGCache();

// Create a new Axios instance
const client = axios.create();

// Add the interceptors to the Axios instance
client.interceptors.request.use(...(cache.getInterceptors() as any));

// Make a request
client.get("http://localhost/test").then(response => {
  console.log(response.data);
});

// Make the same request again
// This time, the response will be served from the cache
client.get("http://localhost/test").then(response => {
  console.log(response.data);
});
```

## API

### `new AxiosETAGCache()`

Creates a new instance of the cache.

### `cache.getInterceptors()`

Returns an array of Axios interceptors that can be used with `axios.interceptors.request.use()`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[ISC](LICENSE)