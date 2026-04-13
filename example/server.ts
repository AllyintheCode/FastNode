import { createApp, z } from "../src";

const app = createApp({
  title: "FastNode Example API",
  version: "2.0.0",
  description: "Auto-documented & validated API built with FastNode + Zod",
});

// ── Schemas ──────────────────────────────────────────────────────────────────

const CreateUserBody = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const UserListQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

// ── Middlewares ──────────────────────────────────────────────────────────────

const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization;
  if (token === "secret-token") return next();
  res.status(401).json({ error: "Unauthorized" });
};

// ── Routes ───────────────────────────────────────────────────────────────────

app.get("/secret", {
  summary: "Protected route",
  tags: ["Security"],
  middleware: [authMiddleware], // New middleware field!
  responses: {
    200: { description: "Secret data" },
    401: { description: "Missing/Invalid token" },
  },
}, (req, res) => {
  res.json({ secret: "The meaning of life is 42" });
});

app.get("/error", {
  summary: "Async error test",
  tags: ["System"],
}, async (req, res) => {
  throw new Error("This is an async crash!");
});

app.post("/users", {
  summary: "Register a new user",
  description: "Creates a user account. Password must be at least 8 characters.",
  tags: ["Users"],
  body: CreateUserBody,
  responses: {
    201: { description: "User created successfully" },
    400: { description: "Validation error" },
    409: { description: "Email already exists" },
  },
}, (req, res) => {
  // ✅ req.body is fully typed: { name: string, email: string, password: string }
  const { name, email } = req.body;
  res.status(201).json({ ok: true, user: { name, email } });
});

app.get("/users", {
  summary: "List all users",
  tags: ["Users"],
  query: UserListQuery,
  responses: {
    200: { description: "Paginated list of users" },
  },
}, (req, res) => {
  // ✅ req.query is typed: { page?: number, limit?: number, search?: string }
  const { page = 1, limit = 10, search } = req.query;
  res.json({ users: [], page, limit, search });
});

app.get("/users/:id", {
  summary: "Get user by ID",
  tags: ["Users"],
  responses: {
    200: { description: "User found" },
    404: { description: "User not found" },
  },
}, (req, res) => {
  res.json({ id: req.params.id });
});

app.put("/users/:id", {
  summary: "Update user",
  tags: ["Users"],
  body: CreateUserBody.partial(), // all fields optional for update
  responses: {
    200: { description: "User updated" },
    400: { description: "Validation error" },
    404: { description: "User not found" },
  },
}, (req, res) => {
  res.json({ ok: true, updated: req.params.id });
});

app.delete("/users/:id", {
  summary: "Delete user",
  tags: ["Users"],
  responses: {
    204: { description: "User deleted" },
    404: { description: "User not found" },
  },
}, (req, res) => {
  res.status(204).send();
});

app.get("/health", {
  summary: "Health check",
  tags: ["System"],
  responses: {
    200: { description: "Service is healthy" },
  },
}, (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── Docs — must be called AFTER all routes ───────────────────────────────────
app.docs("/docs", "/openapi.json");

// ── Global Error Handler ─────────────────────────────────────────────────────
app.useErrors();

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
