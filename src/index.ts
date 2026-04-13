import express, { Application, Router, Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import { generateOpenAPI } from "./openapi";
import { createValidationMiddleware } from "./validate";
import {
  AppInfo,
  HttpMethod,
  RouteConfig,
  RouteDefinition,
  TypedHandler,
  FastNodeApp,
} from "./types";

const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

// ── createApp ────────────────────────────────────────────────────────────────

/**
 * Creates a FastNode application.
 *
 * @example
 * ```ts
 * const app = createApp({ title: "My API", version: "1.0.0" });
 *
 * app.post("/users", {
 *   summary: "Create user",
 *   tags: ["Users"],
 *   body: z.object({ name: z.string(), email: z.string().email() }),
 *   responses: { 201: { description: "Created" } },
 * }, (req, res) => {
 *   const { name, email } = req.body; // ← fully typed!
 *   res.status(201).json({ name, email });
 * });
 *
 * app.docs("/docs");
 * app.listen(3000);
 * ```
 */
export function createApp(info: AppInfo = {}): FastNodeApp {
  const app = express() as unknown as FastNodeApp;
  (app as unknown as Application).use(express.json());

  // Private routes registry scoped to this app instance
  const routes: RouteDefinition[] = [];

  // ── Override HTTP methods ──────────────────────────────────────────────────
  for (const method of HTTP_METHODS) {
    const originalMethod = (app as unknown as Record<string, Function>)[method].bind(app);

    (app as unknown as Record<string, Function>)[method] = function (
      path: string,
      configOrHandler: RouteConfig<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny> | Function,
      handler?: TypedHandler<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>
    ) {
      // Express internal: app.get("trust proxy") — pass through
      if (configOrHandler === undefined && handler === undefined) {
        return originalMethod(path);
      }

      // Standard Express: app.get("/path", handlerFn)
      if (typeof configOrHandler === "function") {
        return originalMethod(path, configOrHandler);
      }

      // Middleware array: app.get("/path", [m1, m2])
      if (Array.isArray(configOrHandler)) {
        return originalMethod(path, ...configOrHandler);
      }

      // FastNode: app.get("/path", { ...config }, handlerFn)
      if (configOrHandler !== null && typeof configOrHandler === "object") {
        if (!handler || typeof handler !== "function") {
          throw new Error(
            `[FastNode] ${method.toUpperCase()} "${path}": A handler function is required as the 3rd argument.`
          );
        }

        // Register route for Swagger doc generation
        routes.push({
          method,
          path,
          config: configOrHandler as RouteConfig<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>,
        });

        // Inject validation middleware before the user's handler
        const validate = createValidationMiddleware(
          configOrHandler as RouteConfig<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>
        );

        // Prepare midleware chain
        const middlewares = (configOrHandler as any).middleware || [];
        const middlewareArray = Array.isArray(middlewares) ? middlewares : [middlewares];

        return originalMethod(path, validate, ...middlewareArray, handler);
      }

      // Fallback
      return originalMethod(path, configOrHandler, handler);
    };
  }

  // ── app.docs() ─────────────────────────────────────────────────────────────
  (app as unknown as FastNodeApp).docs = function (
    docsUrl = "/docs",
    jsonUrl = "/openapi.json"
  ): void {
    const spec = generateOpenAPI(routes, info);
    const port = process.env.PORT ?? 3000;

    // Swagger UI
    (app as unknown as Application).use(
      docsUrl,
      swaggerUi.serve,
      swaggerUi.setup(spec)
    );

    // Raw OpenAPI JSON — use a plain Router to bypass our override
    const jsonRouter = Router();
    jsonRouter.get("/", (_req: Request, res: Response) => res.json(spec));
    (app as unknown as Application).use(jsonUrl, jsonRouter);

    console.log(`[FastNode] Swagger UI  → http://localhost:${port}${docsUrl}`);
    console.log(`[FastNode] OpenAPI JSON → http://localhost:${port}${jsonUrl}`);
  };

  /** Global JSON Error Handler */
  (app as unknown as FastNodeApp).useErrors = function (): void {
    (app as unknown as Application).use(
      (err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        res.status(status).json({
          error: err.message || "Internal Server Error",
          ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
        });
      }
    );
    console.log("[FastNode] Global JSON error handler enabled.");
  };

  return app;
}

// ── Public API ────────────────────────────────────────────────────────────────
export { z } from "zod";
export type { RouteConfig, TypedHandler, AppInfo, FastNodeApp } from "./types";
