import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { RouteDefinition, AppInfo } from "./types";

/** Convert a Zod schema to an OpenAPI 3.0-compatible JSON Schema object. */
function toOpenApiSchema(schema: any): Record<string, unknown> {
  const result = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none", // always inline — no $ref cluttering
  }) as Record<string, unknown>;

  // Clean up fields OpenAPI doesn't need
  delete result["$schema"];
  delete result["additionalProperties"];

  return result;
}

/**
 * Generates a complete OpenAPI 3.0 spec from the collected route definitions.
 * Zod schemas are automatically converted to JSON Schema for request bodies and parameters.
 */
export function generateOpenAPI(
  routes: RouteDefinition[],
  info: AppInfo = {}
): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const { method, path: routePath, config } of routes) {
    // Convert Express :param to OpenAPI {param}
    const openApiPath = routePath.replace(/:([^/]+)/g, "{$1}");

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    // ── Path Parameters ────────────────────────────────────────────────────
    const pathParamNames = [...routePath.matchAll(/:([^/]+)/g)].map(
      (m) => m[1]
    );
    const parameters: Record<string, unknown>[] = [];

    for (const name of pathParamNames) {
      let schema: Record<string, unknown> = { type: "string" };

      // If a Zod params object is provided, extract the individual field schema
      if (config.params && config.params instanceof z.ZodObject) {
        const shape = (config.params as z.ZodObject<any>).shape;
        if (shape[name]) {
          schema = toOpenApiSchema(shape[name]);
        }
      }

      parameters.push({ name, in: "path", required: true, schema });
    }

    // ── Query Parameters ───────────────────────────────────────────────────
    if (config.query && config.query instanceof z.ZodObject) {
      const shape = (config.query as z.ZodObject<z.ZodRawShape>).shape;

      for (const [name, fieldSchema] of Object.entries(shape)) {
        const isOptional = fieldSchema instanceof z.ZodOptional;
        const innerSchema = isOptional
          ? (fieldSchema as z.ZodOptional<any>).unwrap()
          : (fieldSchema as any);

        parameters.push({
          name,
          in: "query",
          required: !isOptional,
          schema: toOpenApiSchema(innerSchema),
        });
      }
    }

    // ── Request Body ───────────────────────────────────────────────────────
    let requestBody: Record<string, unknown> | undefined;

    if (config.body) {
      requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: toOpenApiSchema(config.body),
          },
        },
      };
    }

    // ── Responses ──────────────────────────────────────────────────────────
    const rawResponses = config.responses ?? { 200: { description: "Success" } };
    const responses: Record<string, unknown> = {};

    for (const [code, val] of Object.entries(rawResponses)) {
      responses[String(code)] =
        typeof val === "string" ? { description: val } : val;
    }

    // ── Operation Object ───────────────────────────────────────────────────
    paths[openApiPath][method] = {
      tags: config.tags ?? [],
      summary: config.summary ?? "",
      description: config.description ?? "",
      ...(parameters.length > 0 ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses,
    };
  }

  return {
    openapi: "3.0.0",
    info: {
      title: info.title ?? "FastNode API",
      version: info.version ?? "1.0.0",
      description: info.description ?? "",
    },
    paths,
  };
}
