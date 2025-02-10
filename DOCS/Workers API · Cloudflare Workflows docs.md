---
title: "Workers API · Cloudflare Workflows docs"
source: "https://developers.cloudflare.com/workflows/build/workers-api/"
author:
  - "[[Cloudflare Docs]]"
published: 2025-02-03
created: 2025-02-08
description: "This guide details the Workflows API within Cloudflare Workers, including methods, types, and usage examples."
tags:
  - "clippings"
---
This guide details the Workflows API within Cloudflare Workers, including methods, types, and usage examples.

## WorkflowEntrypoint

The `WorkflowEntrypoint` class is the core element of a Workflow definition. A Workflow must extend this class and define a `run` method with at least one `step` call to be considered a valid Workflow.

```expressive
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {    // Steps here  }};
```

### run

- `run(event: WorkflowEvent<T>, step: WorkflowStep): Promise<T>`
- `event` - the event passed to the Workflow, including an optional `payload` containing data (parameters)
- `step` - the `WorkflowStep` type that provides the step methods for your Workflow

The `run` method can optionally return data, which is available when querying the instance status via the [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/#instancestatus), [REST API](https://developers.cloudflare.com/api/resources/workflows/subresources/instances/subresources/status/) and the Workflows dashboard. This can be useful if your Workflow is computing a result, returning the key to data stored in object storage, or generating some kind of identifier you need to act on.

```expressive
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {    // Steps here    let someComputedState = step.do("my step", async () => { })    // Optional: return state from our run() method    return someComputedState  }};
```

The `WorkflowEvent` type accepts an optional [type parameter ↗](https://www.typescriptlang.org/docs/handbook/2/generics.html#working-with-generic-type-variables) that allows you to provide a type for the `payload` property within the `WorkflowEvent`.

Refer to the [events and parameters](https://developers.cloudflare.com/workflows/build/events-and-parameters/) documentation for how to handle events within your Workflow code.

## WorkflowEvent

```expressive
export type WorkflowEvent<T> = {  payload: Readonly<T>;  timestamp: Date;  instanceId: string;};
```

- The `WorkflowEvent` is the first argument to a Workflow's `run` method, and includes an optional `payload` parameter and a `timestamp` property.

- `payload` - a default type of `any` or type `T` if a type parameter is provided.
- `timestamp` - a `Date` object set to the time the Workflow instance was created (triggered).
- `instanceId` - the ID of the associated instance.

Refer to the [events and parameters](https://developers.cloudflare.com/workflows/build/events-and-parameters/) documentation for how to handle events within your Workflow code.

## WorkflowStep

### step

- `step.do(name: string, callback: (): RpcSerializable): Promise<T>`
- `step.do(name: string, config?: WorkflowStepConfig, callback: (): RpcSerializable): Promise<T>`
- `name` - the name of the step.
- `config` (optional) - an optional `WorkflowStepConfig` for configuring [step specific retry behaviour](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/).
- `callback` - an asynchronous function that optionally returns serializable state for the Workflow to persist.
- `step.sleep(name: string, duration: WorkflowDuration): Promise<void>`
- `name` - the name of the step.
- `duration` - the duration to sleep until, in either seconds or as a `WorkflowDuration` compatible string.
- Refer to the [documentation on sleeping and retrying](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/) to learn more about how how Workflows are retried.
- `step.sleepUntil(name: string, timestamp: Date | number): Promise<void>`
- `name` - the name of the step.
- `timestamp` - a JavaScript `Date` object or seconds from the Unix epoch to sleep the Workflow instance until.

## WorkflowStepConfig

```expressive
export type WorkflowStepConfig = {  retries?: {    limit: number;    delay: string | number;    backoff?: WorkflowBackoff;  };  timeout?: string | number;};
```

- A `WorkflowStepConfig` is an optional argument to the `do` method of a `WorkflowStep` and defines properties that allow you to configure the retry behaviour of that step.

Refer to the [documentation on sleeping and retrying](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/) to learn more about how how Workflows are retried.

## NonRetryableError

- `throw new NonRetryableError(message: string , name string  optional)`: NonRetryableError

- Throws an error that forces the current Workflow instance to fail and not be retried.
- Refer to the [documentation on sleeping and retrying](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/) to learn more about how how Workflows are retried.

## Call Workflows from Workers

Workflows exposes an API directly to your Workers scripts via the [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/#what-is-a-binding) concept. Bindings allow you to securely call a Workflow without having to manage API keys or clients.

You can bind to a Workflow by defining a `[[workflows]]` binding within your Wrangler configuration.

For example, to bind to a Workflow called `workflows-starter` and to make it available on the `MY_WORKFLOW` variable to your Worker script, you would configure the following fields within the `[[workflows]]` binding definition:

- [wrangler.json](https://developers.cloudflare.com/workflows/build/workers-api/#tab-panel-1591)
- [wrangler.toml](https://developers.cloudflare.com/workflows/build/workers-api/#tab-panel-1592)

```expressive
{  "name": "workflows-starter",  "main": "src/index.ts",  "compatibility_date": "2024-10-22",  "workflows": [    {      "name": "workflows-starter",      "binding": "MY_WORKFLOW",      "class_name": "MyWorkflow"    }  ]}
```

### Bind from Pages

You can bind and trigger Workflows from [Pages Functions](https://developers.cloudflare.com/pages/functions/) by deploying a Workers project with your Workflow definition and then invoking that Worker using [service bindings](https://developers.cloudflare.com/pages/functions/bindings/#service-bindings) or a standard `fetch()` call.

Visit the documentation on [calling Workflows from Pages](https://developers.cloudflare.com/workflows/build/call-workflows-from-pages/) for examples.

### Cross-script calls

You can also bind to a Workflow that is defined in a different Worker script from the script your Workflow definition is in. To do this, provide the `script_name` key with the name of the script to the `[[workflows]]` binding definition in your Wrangler configuration.

For example, if your Workflow is defined in a Worker script named `billing-worker`, but you are calling it from your `web-api-worker` script, your `wrangler.toml / wrangler.json` file would resemble the following:

- [wrangler.json](https://developers.cloudflare.com/workflows/build/workers-api/#tab-panel-1593)
- [wrangler.toml](https://developers.cloudflare.com/workflows/build/workers-api/#tab-panel-1594)

```expressive
{  "name": "web-api-worker",  "main": "src/index.ts",  "compatibility_date": "2024-10-22",  "workflows": [    {      "name": "billing-workflow",      "binding": "MY_WORKFLOW",      "class_name": "MyWorkflow",      "script_name": "billing-worker"    }  ]}
```

## Workflow

The `Workflow` type provides methods that allow you to create, inspect the status, and manage running Workflow instances from within a Worker script.

```expressive
interface Env {  // The 'MY_WORKFLOW' variable should match the "binding" value set in the Wrangler config file  MY_WORKFLOW: Workflow;}
```

The `Workflow` type exports the following methods:

### create

Create (trigger) a new instance of the given Workflow.

- `create(options?: WorkflowInstanceCreateOptions): Promise<WorkflowInstance>`
- `options` - optional properties to pass when creating an instance, including a user-provided ID and payload parameters.

An ID is automatically generated, but a user-provided ID can be specified (up to 64 characters <sup><a id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label" aria-expanded="false" class="footnote" tabindex="0">1</a></sup>). This can be useful when mapping Workflows to users, merchants or other identifiers in your system. You can also provide a JSON object as the `params` property, allowing you to pass data for the Workflow instance to act on as its [`WorkflowEvent`](https://developers.cloudflare.com/workflows/build/events-and-parameters/).

```expressive
// Create a new Workflow instance with your own ID and pass params to the Workflow instancelet instance = await env.MY_WORKFLOW.create({  id: myIdDefinedFromOtherSystem,  params: { "hello": "world" }})return Response.json({  id: instance.id,  details: await instance.status(),});
```

Returns a `WorkflowInstance`.

You can also provide a type parameter to the `Workflows` type when creating (triggering) a Workflow instance using the `create` method of the [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/#workflow). Note that this does *not* propagate type information into the Workflow itself, as TypeScript types are a build-time construct. To provide the type of an incoming `WorkflowEvent`, refer to the [TypeScript and type parameters](https://developers.cloudflare.com/workflows/build/events-and-parameters/#typescript-and-type-parameters) section of the Workflows documentation.

To provide an optional type parameter to the `Workflow`, pass a type argument with your type when defining your Workflow bindings:

```expressive
interface User {  email: string;  createdTimestamp: number;}interface Env {  // Pass our User type as the type parameter to the Workflow definition  MY_WORKFLOW: Workflow<User>;}export default {  async fetch(request, env, ctx) {    // More likely to come from your database or via the request body!    const user: User = {      email: user@example.com,      createdTimestamp: Date.now()    }    let instance = await env.MY_WORKFLOW.create({      // params expects the type User      params: user    })    return Response.json({      id: instance.id,      details: await instance.status(),    });  }}
```

### get

Get a specific Workflow instance by ID.

- `get(id: string): Promise<WorkflowInstance>`
- `id` - the ID of the Workflow instance.

Returns a `WorkflowInstance`. Throws an exception if the instance ID does not exist.

```expressive
// Fetch an existing Workflow instance by ID:try {  let instance = await env.MY_WORKFLOW.get(id)  return Response.json({    id: instance.id,    details: await instance.status(),  });} catch (e: any) {  // Handle errors  // .get will throw an exception if the ID doesn't exist or is invalid.  const msg = \`failed to get instance ${id}: ${e.message}\`  console.error(msg)  return Response.json({error: msg}, { status: 400 })}
```

## WorkflowInstanceCreateOptions

Optional properties to pass when creating an instance.

```expressive
interface WorkflowInstanceCreateOptions {  /**   * An id for your Workflow instance. Must be unique within the Workflow.   */  id?: string;  /**   * The event payload the Workflow instance is triggered with   */  params?: unknown;}
```

## WorkflowInstance

Represents a specific instance of a Workflow, and provides methods to manage the instance.

```expressive
declare abstract class WorkflowInstance {  public id: string;  /**   * Pause the instance.   */  public pause(): Promise<void>;  /**   * Resume the instance. If it is already running, an error will be thrown.   */  public resume(): Promise<void>;  /**   * Terminate the instance. If it is errored, terminated or complete, an error will be thrown.   */  public terminate(): Promise<void>;  /**   * Restart the instance.   */  public restart(): Promise<void>;  /**   * Returns the current status of the instance.   */  public status(): Promise<InstanceStatus>;}
```

### id

Return the id of a Workflow.

- `id: string`

### status

Return the status of a running Workflow instance.

- `status(): Promise<void>`

### pause

Pause a running Workflow instance.

- `pause(): Promise<void>`

### restart

Restart a Workflow instance.

- `restart(): Promise<void>`

### terminate

Terminate a Workflow instance.

- `terminate(): Promise<void>`

### InstanceStatus

Details the status of a Workflow instance.

```expressive
type InstanceStatus = {  status:    | "queued" // means that instance is waiting to be started (see concurrency limits)    | "running"    | "paused"    | "errored"    | "terminated" // user terminated the instance while it was running    | "complete"    | "waiting" // instance is hibernating and waiting for sleep or event to finish    | "waitingForPause" // instance is finishing the current work to pause    | "unknown";  error?: string;  output?: object;};
```