import NodeCache from "node-cache";

const fifteenMin = 900;
const threeHours = 10800;

export interface CacheValue {
  etag: string;
  value: any;
  maxAge: number;
  timestamp: any;
}

export class Cache {
  static instance: Cache;
  cache: NodeCache;

  static getInstance() {
    if (!this.instance) {
      this.instance = new Cache(threeHours);
    }
    return this.instance;
  }

  static get(uuid: string): CacheValue | undefined {
    return this.getInstance().cache.get(uuid);
  }

  static set(
    uuid: string,
    etag: string,
    maxAge: number,
    timestamp: any,
    value: any
  ) {
    return this.getInstance().cache.set(
      uuid,
      { etag, maxAge, timestamp, value },
      maxAge !== 0 ? maxAge : fifteenMin
    );
  }

  static reset() {
    this.getInstance().cache.flushAll();
  }

  constructor(stdTTL: number) {
    this.cache = new NodeCache({ stdTTL });
  }
}
