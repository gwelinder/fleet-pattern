---
title: "JStack Docs - Full-Stack Next.js & TypeScript Toolkit"
source: "https://jstack.app/docs/backend/middleware"
author:
  - "[[@joshtriedcoding]]"
published:
created: 2025-02-09
description: "Build fast, reliable Next.js apps with the most modern web technologies."
tags:
  - "clippings"
---
## Middleware

Middleware in JStack allows you to add reusable logic between your procedure requests and handlers. It's perfect for cross-cutting concerns like authentication, logging, or error handling.

## Basic Middleware Structure

## Common Use Cases

### Authentication Middleware

The following middleware authenticates a user. When our procedure runs, we can be 100% sure that this user really exists, because otherwise the middleware will throw an error and prevent the procedure from running:

On any `privateProcedure` we can now safely access the user object:

server/routers/post-router.ts

## Middleware Chaining

Chain multiple middlewares using `.use()`:

If you have multiple middlewares that depend on each other, by definition JStack cannot know the order in which they were run. Therefore, use the type inference utility:

## Using Hono Middleware

JStack is compatible with Hono middleware via the `fromHono` adapter:

## Best Practices

- Keep middleware focused on a single responsibility
- Handle errors via your `appRouter`'s `onError()`

## Common Middleware Examples

- Authentication
- Request logging
- Rate limiting
- Error handling
- Request validation
- Performance monitoring
- CORS handling

→ To see all built-in Hono middleware, check out the [Hono middleware documentation](https://hono.dev/docs/middleware/builtin/basic-auth).