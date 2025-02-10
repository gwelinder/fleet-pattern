---
title: "JStack Docs - Full-Stack Next.js & TypeScript Toolkit"
source: "https://jstack.app/docs/backend/websockets"
author:
  - "[[@joshtriedcoding]]"
published:
created: 2025-02-09
description: "Build fast, reliable Next.js apps with the most modern web technologies."
tags:
  - "clippings"
---
## WebSockets

WebSocket procedures enable **real-time bi-directional communication** between the client and server without the need to manage *any kind of infrastructure* 🥳.

> **Important:** JStack's WebSocket implementation is designed specifically for Cloudflare Workers. This is because Cloudflare Workers allow [long-lived real-time connections](https://developers.cloudflare.com/workers/runtime-apis/websockets/) while Vercel and other Node.js runtime providers do not.

A WebSocket handler receives the following objects:

- `c`: [Hono context](https://hono.dev/docs/api/context), e.g. headers, request info, env variables
- `ctx`: Your context, e.g. database instance, authenticated user
- `io`: Connection manager for sending messages to clients

## WebSockets Example

WebSockets are incredible for real-time features:

- Collaborative editing
- Real-time chat
- Live dashboard updates

**Example**: In the WebSocket router below, we implement a basic chat:

- Validate `incoming`/`outgoing` messages using the `chatValidator`
- Manage WebSocket connections and room-based message broadcasting

server/routers/chat-router.ts

You can now listen to (and emit) real-time events on the client:

## WebSockets Setup

### Development

To make scalable, serverless WebSockets possible, JStack uses [Upstash Redis](https://upstash.com/) as its real-time engine. Deploying real-world, production WebSocket applications is possible without a credit card, entirely on their free tier.

*Side note: In the future, I'd like to add the ability to provide your own Redis connection string (e.g. self-hosted).*

1. After [logging into Upstash](https://upstash.com/), create a Redis database by clicking the *Create Database* button
2. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env variables into a `.dev.vars` file in the root of your app
3. Start your Cloudflare backend using
4. Point the client `baseUrl` to the Cloudflare backend on port `8080`:

**That's it! 🎉** You can now use WebSockets for your local development. See below for an examle usage.

### Deployment

1. Deploy your backend to Cloudflare Workers using [wrangler](https://developers.cloudflare.com/workers/wrangler/):

**Reason**: Serverless functions, such as those provided by Vercel, Netlify, or other serverless platforms, have a maximum execution limit and do not support long-lived connections. [Cloudflare workers do](https://developers.cloudflare.com/workers/runtime-apis/websockets/).

The console output looks like this:
2. Add the deployment URL to the client:

1. Set the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env variables in your Worker so it can access them:

**That's it! 🎉** If you now deploy your app to Vercel, Netlify, etc., the client will automatically connect to your production Cloudflare Worker.

You can verify the connection by sending a request to: