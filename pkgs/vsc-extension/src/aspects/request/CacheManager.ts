import { Manager } from "../manager/Manager";

export namespace RequestCacheManager {
  export interface Props<
    Provider extends RequestCacheManager.Provider<any, any>,
  > {
    ttl: number; // in milliseconds
    provider: Provider;
  }

  export interface Provider<Response, HashContext = undefined> {
    hash?: RequestProviderHash<Response, HashContext>;

    fetchedAt(response: Response): number;

    ok(response: Response): boolean;
  }

  export interface RequestProviderHash<Response, HashContext> {
    content(context: HashContext): string;

    context(response: Response): HashContext;
  }

  export type ProviderResponse<
    Provider extends RequestCacheManager.Provider<any, any>,
  > =
    Provider extends RequestCacheManager.Provider<infer Response, any>
      ? Response
      : never;

  export type ProviderHashContext<
    Provider extends RequestCacheManager.Provider<any, any>,
  > =
    Provider extends RequestCacheManager.Provider<any, infer Context>
      ? Context
      : never;

  export type AccessFn<
    Provider extends RequestCacheManager.Provider<any, any>,
  > =
    ProviderHashContext<Provider> extends infer HashContext
      ? HashContext extends undefined
        ? () => ProviderResponse<Provider> | undefined
        : (
            context: ProviderHashContext<Provider>,
          ) => ProviderResponse<Provider> | undefined
      : never;
}

export class RequestCacheManager<
  Provider extends RequestCacheManager.Provider<any, any>,
> extends Manager {
  #ttl: number;
  #provider: Provider;
  #response: RequestCacheManager.ProviderResponse<Provider> | undefined;

  constructor(parent: Manager, props: RequestCacheManager.Props<Provider>) {
    super(parent);

    this.#ttl = props.ttl;
    this.#provider = props.provider;
  }

  access: RequestCacheManager.AccessFn<Provider> = ((context) => {
    const validCache = this.#isValid(context) ? this.#response : undefined;
    if (validCache) return validCache;
    this.clear();
  }) as RequestCacheManager.AccessFn<Provider>;

  store(response: RequestCacheManager.ProviderResponse<Provider>) {
    if (!this.#provider.ok(response)) return this.clear();
    this.#response = response;
  }

  clear() {
    this.#response = undefined;
  }

  #isValid(
    context: RequestCacheManager.ProviderHashContext<Provider>,
  ): boolean {
    return (
      !!this.#response &&
      this.#provider.fetchedAt(this.#response) + this.#ttl > Date.now() &&
      (!this.#provider.hash ||
        this.#provider.hash.content(
          this.#provider.hash.context(this.#response),
        ) === this.#provider.hash.content(context))
    );
  }
}
