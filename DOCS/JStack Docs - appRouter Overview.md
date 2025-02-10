---
title: "JStack Docs - Full-Stack Next.js & TypeScript Toolkit"
source: "https://jstack.app/docs/backend/app-router"
author:
  - "[[@joshtriedcoding]]"
published:
created: 2025-02-09
description: "Build fast, reliable Next.js apps with the most modern web technologies."
tags:
  - "clippings"
---
## appRouter Overview

The `appRouter` in JStack:

- Routes requests to the procedure that handles them
- Serves as an entry point to deploy your backend

An `appRouter` knows all the routes and their handlers; deploying your backend is as easy as deploying the `appRouter`. Since JStack is built on top of Hono, you can deploy this router anywhere: Vercel, Netlify, Cloudflare, AWS, Railway, etc.

## Creating the appRouter

An `appRouter` is built on top of a base `api` that defines global behaviors. For example, where your API is served from, error handling, 404 response handling, or global middleware:

## Configuration Options

All JStack routers are lightweight, minimal extensions built on top of the [Hono API](https://hono.dev/docs/api/hono). Any method you can call on the Hono API, you can also call on JStack routers:

- Global error handling
- 404 response handling
- [View all available methods](https://hono.dev/docs/api/hono)

Here are the most common methods:

### Error Handling

I recommend using JStacks default error handler via `j.defaults.errorHandler`. It catches all router errors and returns standardized error responses that you can easily handle on the frontend.

You can also customize error handling if needed:

### Base Path

To configure where your API is served from, adjust the `basePath` parameter and rename your api directory to match this new path:

### CORS

Nobody likes CORS (🤮), but it's a necessary evil for security reasons. I recommend using JStack's default CORS middleware:

You can also customize CORS if needed using [Hono's built-in CORS middleware](https://hono.dev/docs/middleware/builtin/cors). In this case, it's very important to whitelist the `x-is-superjson` header, as JStack uses this internally for `c.superjson()` responses:

### Inferring Router Inputs/Outputs