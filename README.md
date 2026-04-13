# 🚀 FastNode

**FastNode** is a lightweight, developer-first Node.js framework that brings a **FastAPI**-like developer experience to the Node.js ecosystem. It enhances **Express** with automatic validation, OpenAPI documentation, and TypeScript-powered type safety using **Zod**.

## 🌟 Why FastNode?

Building APIs in Express often requires repetitive manual work:

- ❌ Manual request validation
- ❌ Manual API documentation (Swagger)
- ❌ No built-in type safety
- ❌ Boilerplate-heavy route setup

**FastNode** solves this by unifying everything into a single source of truth: **your schema**.

## ⚡ Key Features

- 🛡️ **Zod-powered validation**: Validate request body, query, and params automatically.
- 📄 **Automatic OpenAPI generation**: No manual Swagger/YAML files needed.
- 📊 **Built-in Swagger UI**: Explore and test your API instantly at `/docs`.
- 💎 **TypeScript-first experience**: Fully inferred types from schemas.
- 🚀 **Express-compatible**: Built on top of Express with zero complexity loss.

## 📦 Installation

```bash
npm install fastnode-zod zod express swagger-ui-express
```

## 🚀 Quick Start

```typescript
import { createApp, z } from "fastnode-zod";

const app = createApp({
  title: "My API",
  version: "1.0.0"
});

// Define schema once
const UserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email()
});

// Create route with automatic validation + docs
app.post(
  "/users",
  {
    summary: "Create a new user",
    body: UserSchema,
    tags: ["Users"]
  },
  (req, res) => {
    // req.body is fully typed!
    const { username, email } = req.body;

    res.status(201).json({
      message: "User created successfully",
      data: { username, email }
    });
  }
);

// Swagger UI
app.docs();

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Docs available at http://localhost:3000/docs");
});
```

## 🧠 Core Concept

FastNode is built on one principle: **Define once. Validate everywhere. Document automatically.**

You define your schema using Zod, and FastNode handles:
1. Request validation
2. Type inference
3. OpenAPI schema generation
4. Swagger documentation

## 🔧 Example

```typescript
const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  inStock: z.boolean()
});

app.post("/products", {
  body: ProductSchema,
  summary: "Create product"
}, (req, res) => {
  res.json({ ok: true });
});
```

## 📊 What FastNode Generates Automatically

- OpenAPI 3.0 specification
- Swagger UI interface (`/docs`)
- Request validation middleware
- Typed request objects

## 🧩 Philosophy

FastNode is not trying to replace Express. It is designed to be a minimal abstraction layer that upgrades Express into a modern API framework without increasing complexity.

## 📄 Tech Stack

- Node.js
- Express.js
- Zod
- TypeScript
- Swagger UI

## 📌 Roadmap

- [ ] Middleware system
- [ ] Decorator-based API (`@Get`, `@Post`)
- [ ] Response schema validation
- [ ] Plugin system
- [ ] CLI tool (`fastnode create`)

## 📄 License

MIT © 2026
