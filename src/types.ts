import { z } from "zod";
import { Request, Response, NextFunction, Application } from "express";

/** Supported HTTP methods */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * Route configuration object passed to app.get/post/put/patch/delete.
 *
 * @template TBody   - Zod schema for the request body
 * @template TQuery  - Zod schema for the query string
 * @template TParams - Zod schema for the URL parameters
 */
export interface RouteConfig<
  TBody extends z.ZodTypeAny = z.ZodUnknown,
  TQuery extends z.ZodTypeAny = z.ZodUnknown,
  TParams extends z.ZodTypeAny = z.ZodUnknown,
> {
  /** Short summary shown in Swagger UI */
  summary?: string;
  /** Longer description shown in Swagger UI */
  description?: string;
  /** Tag groups for organizing endpoints in Swagger UI */
  tags?: string[];
  /** Zod schema for the request body — also used for validation */
  body?: TBody;
  /** Zod schema for query params — also used for validation */
  query?: TQuery;
  /** Zod schema for URL path params — also used for validation */
  params?: TParams;
  /** OpenAPI response definitions */
  responses?: Record<number, { description: string } | string>;
  /** Optional middleware(s) to run after validation but before the handler */
  middleware?: NextFunction | NextFunction[] | any | any[];
}

/** A typed Express request handler inferred from the route config. */
export type TypedHandler<
  TBody extends z.ZodTypeAny = z.ZodUnknown,
  TQuery extends z.ZodTypeAny = z.ZodUnknown,
  TParams extends z.ZodTypeAny = z.ZodUnknown,
> = (
  req: Request<
    TParams extends z.ZodUnknown ? Record<string, string> : z.infer<TParams>,
    unknown,
    TBody extends z.ZodUnknown ? any : z.infer<TBody>,
    TQuery extends z.ZodUnknown ? Record<string, any> : z.infer<TQuery>
  >,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/** Internal route registry entry */
export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  config: RouteConfig<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>;
}

/** Options passed to createApp() */
export interface AppInfo {
  title?: string;
  version?: string;
  description?: string;
}

/**
 * A FastNode app is a typed Express app that intercepts route registration
 * to collect metadata for automatic OpenAPI doc generation and Zod validation.
 */
export interface FastNodeApp extends Omit<Application, "get" | "post" | "put" | "patch" | "delete"> {
  /**
   * Mount Swagger UI and raw OpenAPI JSON endpoint.
   * Must be called AFTER all routes are defined.
   */
  docs(docsUrl?: string, jsonUrl?: string): void;

  /**
   * Mounts a global JSON error handler. 
   * Catches async errors and returns them as { error: message, details? }.
   */
  useErrors(): void;

  /** Settings getter (Express internal) */
  get(name: string): any;

  /** Route definition with config */
  get<
    B extends z.ZodTypeAny = z.ZodUnknown,
    Q extends z.ZodTypeAny = z.ZodUnknown,
    P extends z.ZodTypeAny = z.ZodUnknown,
  >(
    path: string,
    config: RouteConfig<B, Q, P>,
    handler: TypedHandler<B, Q, P>
  ): this;

  /** Standard Express route definition */
  get(path: string, ...handlers: any[]): this;

  post<
    B extends z.ZodTypeAny = z.ZodUnknown,
    Q extends z.ZodTypeAny = z.ZodUnknown,
    P extends z.ZodTypeAny = z.ZodUnknown,
  >(
    path: string,
    config: RouteConfig<B, Q, P>,
    handler: TypedHandler<B, Q, P>
  ): this;

  post(path: string, ...handlers: any[]): this;

  put<
    B extends z.ZodTypeAny = z.ZodUnknown,
    Q extends z.ZodTypeAny = z.ZodUnknown,
    P extends z.ZodTypeAny = z.ZodUnknown,
  >(
    path: string,
    config: RouteConfig<B, Q, P>,
    handler: TypedHandler<B, Q, P>
  ): this;

  put(path: string, ...handlers: any[]): this;

  patch<
    B extends z.ZodTypeAny = z.ZodUnknown,
    Q extends z.ZodTypeAny = z.ZodUnknown,
    P extends z.ZodTypeAny = z.ZodUnknown,
  >(
    path: string,
    config: RouteConfig<B, Q, P>,
    handler: TypedHandler<B, Q, P>
  ): this;

  patch(path: string, ...handlers: any[]): this;

  delete<
    B extends z.ZodTypeAny = z.ZodUnknown,
    Q extends z.ZodTypeAny = z.ZodUnknown,
    P extends z.ZodTypeAny = z.ZodUnknown,
  >(
    path: string,
    config: RouteConfig<B, Q, P>,
    handler: TypedHandler<B, Q, P>
  ): this;

  delete(path: string, ...handlers: any[]): this;
}
