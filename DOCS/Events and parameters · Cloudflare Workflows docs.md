---
title: "Events and parameters · Cloudflare Workflows docs"
source: "https://developers.cloudflare.com/workflows/build/events-and-parameters/"
author:
  - "[[Cloudflare Docs]]"
published:
created: 2025-02-08
description: "When a Workflow is triggered, it can receive an optional event. This event can include data that your Workflow can act on, including request details, user data fetched from your database (such as D1 or KV) or from a webhook, or messages from a Queue consumer."
tags:
  - "clippings"
---
When a Workflow is triggered, it can receive an optional event. This event can include data that your Workflow can act on, including request details, user data fetched from your database (such as D1 or KV) or from a webhook, or messages from a Queue consumer.

Events are a powerful part of a Workflow, as you often want a Workflow to act on data. Because a given Workflow instance executes durably, events are a useful way to provide a Workflow with data that should be immutable (not changing) and/or represents data the Workflow needs to operate on at that point in time.

## Pass parameters to a Workflow

You can pass parameters to a Workflow in two ways:

- As an optional argument to the `create` method on a [Workflow binding](https://developers.cloudflare.com/workers/wrangler/commands/#trigger) when triggering a Workflow from a Worker.
- Via the `--params` flag when using the `wrangler` CLI to trigger a Workflow.

You can pass any JSON-serializable object as a parameter.

```expressive
export default {  async fetch(req: Request, env: Env) {    let someEvent = { url: req.url, createdTimestamp: Date.now() }    // Trigger our Workflow    // Pass our event as the second parameter to the \`create\` method    // on our Workflow binding.    let instance = await env.MY_WORKFLOW.create({      id: await crypto.randomUUID(),      params: someEvent    });    return Response.json({      id: instance.id,      details: await instance.status(),    });    return Response.json({ result });  },};
```

To pass parameters via the `wrangler` command-line interface, pass a JSON string as the second parameter to the `workflows trigger` sub-command:

```expressive
npx wrangler@latest workflows trigger workflows-starter '{"some":"data"}'
```

```output
🚀 Workflow instance "57c7913b-8e1d-4a78-a0dd-dce5a0b7aa30" has been queued successfully
```

## TypeScript and type parameters

By default, the `WorkflowEvent` passed to the `run` method of your Workflow definition has a type that conforms to the following, with `payload` (your data), `timestamp`, and `instanceId` properties:

```expressive
export type WorkflowEvent<T> = {  // The data passed as the parameter when the Workflow instance was triggered  payload: T;  // The timestamp that the Workflow was triggered  timestamp: Date;  // ID of the current Workflow instance  instanceId: string;};
```

You can optionally type these events by defining your own type and passing it as a [type parameter ↗](https://www.typescriptlang.org/docs/handbook/2/generics.html#working-with-generic-type-variables) to the `WorkflowEvent`:

```expressive
// Define a type that conforms to the events your Workflow instance is// instantiated withinterface YourEventType {  userEmail: string;  createdTimestamp: number;  metadata?: Record<string, string>;}
```

When you pass your `YourEventType` to `WorkflowEvent` as a type parameter, the `event.payload` property now has the type `YourEventType` throughout your workflow definition:

```expressive
// Import the Workflow definitionimport { WorkflowEntrypoint, WorkflowStep, WorkflowEvent} from 'cloudflare:workers';export class MyWorkflow extends WorkflowEntrypoint {    // Pass your type as a type parameter to WorkflowEvent    // The 'payload' property will have the type of your parameter.    async run(event: WorkflowEvent<YourEventType>, step: WorkflowStep) {        let state = step.do("my first step", async () => {          // Access your properties via event.payload          let userEmail = event.payload.userEmail          let createdTimestamp = event.payload.createdTimestamp        })        step.do("my second step", async () => { /* your code here */ )    }}
```

You can also provide a type parameter to the `Workflows` type when creating (triggering) a Workflow instance using the `create` method of the [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/#workflow). Note that this does *not* propagate type information into the Workflow itself, as TypeScript types are a build-time construct. To provide the type of an incoming `WorkflowEvent`, refer to the [TypeScript and type parameters](https://developers.cloudflare.com/workflows/build/events-and-parameters/#typescript-and-type-parameters) section of the Workflows documentation.

## Was this helpful?