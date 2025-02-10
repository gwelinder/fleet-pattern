---
title: "JStack Docs - Full-Stack Next.js & TypeScript Toolkit"
source: "https://jstack.app/docs/backend/routers"
author:
  - "[[@joshtriedcoding]]"
published:
created: 2025-02-09
description: "Build fast, reliable Next.js apps with the most modern web technologies."
tags:
  - "clippings"
---
## About Routers

A router in JStack is a **collection of procedures** (API endpoints) related to a specific feature or resource. For example:

- `userRouter` for user management operations
- `postRouter` for blog post operations
- `paymentRouter` for payment related endpoints

## Creating a Router

1. Create a new file in `server/routers`:

server/routers/post-router.ts
2. Add procedures to your router:
3. Register your router with the main `appRouter`:

Under the hood, each procedure is a separate HTTP endpoint. The URL structure is as follows:

- The base path of your API (`/api`)
- The router name (`post`)
- The procedure name (`list`)

For example, the `list` procedure is now available at