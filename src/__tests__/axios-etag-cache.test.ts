
import { AxiosETAGCache } from "../axios-etag-cache";
import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
    http.get("http://localhost/test", ({ request }) => {
    const etag = request.headers.get("if-none-match");
    if (etag === "test-etag") {
      return new HttpResponse(null, { status: 304 });
    }
    return HttpResponse.json({ hello: "world" }, { headers: { etag: "test-etag" } });
  })
);


describe("AxiosETAGCache", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("should cache the response", async () => {
    const cache = new AxiosETAGCache();
    const client = axios.create();
    // @ts-ignore
    client.interceptors.request.use(...cache.getInterceptors());

    const response1 = await client.get("http://localhost/test");
    const response2 = await client.get("http://localhost/test");

    expect(response1.data).toEqual({ hello: "world" });
    expect(response2.data).toEqual({ hello: "world" });
  });
});
