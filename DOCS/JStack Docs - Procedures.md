---
title: "JStack Docs - Full-Stack Next.js & TypeScript Toolkit"
source: "https://jstack.app/docs/backend/procedures"
author:
  - "[[@joshtriedcoding]]"
published:
created: 2025-02-09
description: "Build fast, reliable Next.js apps with the most modern web technologies."
tags:
  - "clippings"
---
## Procedures

A procedure in JStack is an **API endpoint that handles a specific operation**. There are three kinds of procedures:

- `get` procedures for GET requests
- `post` procedures for POST requests
- `ws` (WebSocket) procedures for real-time communication

For simplicity, I recommend defining procedures and middleware in the `jstack.ts` file. You can create a separate file if necessary.

## Procedures Overview

By default, JStack provides a `publicProcedure` that anyone, authenticated or not, can call. It serves as a base from which to build new procedures:

## Example Procedure

Let's create a procedure that **only authenticated users** can call:

### Example Procedure Usage

server/routers/post-router.ts

**Tada!** 🎉 Now only authenticated users can call our `/api/post/list` endpoint. Unauthenticated users will be rejected with a 401 response.

## GET Procedures

`GET` procedures are used to read data from your API. They accept input via URL query parameters and use HTTP GET requests. Define them using the `.get()` method.

The handler receives the following objects:

- `c`: [Hono context](https://hono.dev/docs/api/context), e.g. headers, request info, env variables
- `ctx`: Your context, e.g. database instance, authenticated user
- `input`: Validated input (optional)

server/routers/post-router.ts

To call a `GET` procedure in your application, use your client's `$get` method:

## POST Procedures

`POST` procedures are used to modify, create or delete data. They accept input via the request body and use HTTP POST requests. Define them using the `.post()` method.

Like GET procedures, the handler receives the following objects:

- `c`: [Hono Context](https://hono.dev/docs/api/context), e.g. headers, request info, env variables
- `ctx`: Your context, e.g. database instance, authenticated user
- `input`: Validated input (optional)

server/routers/post-router.ts

To call a `POST` procedure in your application, use your client's `$post` method:

## Input Validation

JStack has built-in runtime validation for user input using [Zod](https://zod.dev/?id=basic-usage). To set up an input validator, use the `procedure.input()` method:

server/routers/post-router.ts

If an API request does not contain the expected input (either as a URL parameter for `get()` or as a request body for `post()`), your global `onError` will automatically catch this error for easy frontend handling.

Also, if you call this procedure from the client, you'll get immediate feedback about the expected input:

## WebSocket Procedures

WebSocket procedures provide real-time bi-directional communication between the client and server. They are created using the `ws()` method and can specify schemas for incoming and outgoing messages.

The handler receives the following objects:

- `c`: [Hono context](https://hono.dev/docs/api/context), e.g. headers, request info, env variables
- `ctx`: Your context, e.g. database instance, authenticated user
- `io`: Connection manager for sending messages to clients

server/routers/post-router.ts

WebSocket procedures are serverless, with no additional infrastructure management. To make this possible, JStack uses Upstash Redis as its real-time engine and expects WebSocket procedures to be deployed to Cloudflare Workers.

[→ JStack WebSocket Docs](https://jstack.app/docs/backend/websockets)