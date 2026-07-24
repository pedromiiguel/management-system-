export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequest<Body = undefined> = {
  url: string;
  method: HttpMethod;
  queryParams?: Record<string, unknown>;
  body?: Body;
  headers?: Record<string, string>;
};

export type HttpResponse<T> = { statusCode: number; body: T };

export interface IHttpClient {
  request: <Body, Response>(data: HttpRequest<Body>) => Promise<HttpResponse<Response>>;
}
