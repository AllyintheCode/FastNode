import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { RouteConfig } from "./types";

/**
 * Creates an Express middleware that validates request body, query, and params
 * against the provided Zod schemas.
 *
 * On validation failure → 400 JSON with detailed field-level errors.
 * On success → req.body / req.query / req.params are replaced with parsed values.
 */
export function createValidationMiddleware(
  config: RouteConfig<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors: Record<string, unknown> = {};

    // Validate body
    if (config.body) {
      const result = config.body.safeParse(req.body);
      if (!result.success) {
        errors.body = result.error.flatten().fieldErrors;
      } else {
        req.body = result.data;
      }
    }

    // Validate query string
    if (config.query) {
      const result = config.query.safeParse(req.query);
      if (!result.success) {
        errors.query = result.error.flatten().fieldErrors;
      } else {
        Object.defineProperty(req, "query", {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    }

    // Validate path params
    if (config.params) {
      const result = config.params.safeParse(req.params);
      if (!result.success) {
        errors.params = result.error.flatten().fieldErrors;
      } else {
        Object.defineProperty(req, "params", {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    next();
  };
}
