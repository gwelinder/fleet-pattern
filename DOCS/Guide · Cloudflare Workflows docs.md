---
title: "Guide · Cloudflare Workflows docs"
source: "https://developers.cloudflare.com/workflows/get-started/guide/"
author:
  - "[[Cloudflare Docs]]"
published: 2025-01-29
created: 2025-02-08
description: "Workflows allow you to build durable, multi-step applications using the Workers platform. A Workflow can automatically retry, persist state, run for hours or days, and coordinate between third-party APIs."
tags:
  - "clippings"
---
Workflows allow you to build durable, multi-step applications using the Workers platform. A Workflow can automatically retry, persist state, run for hours or days, and coordinate between third-party APIs.

You can build Workflows to post-process file uploads to [R2 object storage](https://developers.cloudflare.com/r2/), automate generation of [Workers AI](https://developers.cloudflare.com/workers-ai/) embeddings into a [Vectorize](https://developers.cloudflare.com/vectorize/) vector database, or to trigger user lifecycle emails using your favorite email API.

This guide will instruct you through:

- Defining your first Workflow and publishing it
- Deploying the Workflow to your Cloudflare account
- Running (triggering) your Workflow and observing its output

At the end of this guide, you should be able to author, deploy and debug your own Workflows applications.

## Prerequisites

1. Sign up for a [Cloudflare account ↗](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js` ↗](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta ↗](https://volta.sh/) or [nvm ↗](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1\. Define your Workflow

To create your first Workflow, use the `create cloudflare` (C3) CLI tool, specifying the Workflows starter template:

```expressive
npm create cloudflare@latest workflows-starter -- --template "cloudflare/workflows-starter"
```

This will create a new folder called `workflows-starter`.

Open the `src/index.ts` file in your text editor. This file contains the following code, which is the most basic instance of a Workflow definition:

```expressive
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';type Env = {  // Add your bindings here, e.g. Workers KV, D1, Workers AI, etc.  MY_WORKFLOW: Workflow;};// User-defined params passed to your workflowtype Params = {  email: string;  metadata: Record<string, string>;};export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {    // Can access bindings on \`this.env\`    // Can access params on \`event.payload\`    const files = await step.do('my first step', async () => {      // Fetch a list of files from $SOME_SERVICE      return {        files: [          'doc_7392_rev3.pdf',          'report_x29_final.pdf',          'memo_2024_05_12.pdf',          'file_089_update.pdf',          'proj_alpha_v2.pdf',          'data_analysis_q2.pdf',          'notes_meeting_52.pdf',          'summary_fy24_draft.pdf',        ],      };    });    const apiResponse = await step.do('some other step', async () => {      let resp = await fetch('https://api.cloudflare.com/client/v4/ips');      return await resp.json<any>();    });    await step.sleep('wait on something', '1 minute');    await step.do(      'make a call to write that could maybe, just might, fail',      // Define a retry strategy      {        retries: {          limit: 5,          delay: '5 second',          backoff: 'exponential',        },        timeout: '15 minutes',      },      async () => {        // Do stuff here, with access to the state from our previous steps        if (Math.random() > 0.5) {          throw new Error('API call to $STORAGE_SYSTEM failed');        }      },    );  }}
```

A Workflow definition:

1. Defines a `run` method that contains the primary logic for your workflow.
2. Has at least one or more calls to `step.do` that encapsulates the logic of your Workflow.
3. Allows steps to return (optional) state, allowing a Workflow to continue execution even if subsequent steps fail, without having to re-run all previous steps.

A single Worker application can contain multiple Workflow definitions, as long as each Workflow has a unique class name. This can be useful for code re-use or to define Workflows which are related to each other conceptually.

Each Workflow is otherwise entirely independent: a Worker that defines multiple Workflows is no different from a set of Workers that define one Workflow each.

## 2\. Create your Workflows steps

Each `step` in a Workflow is an independently retriable function.

A `step` is what makes a Workflow powerful, as you can encapsulate errors and persist state as your Workflow progresses from step to step, avoiding your application from having to start from scratch on failure and ultimately build more reliable applications.

- A step can execute code (`step.do`) or sleep a Workflow (`step.sleep`).
- If a step fails (throws an exception), it will be automatically be retried based on your retry logic.
- If a step succeeds, any state it returns will be persisted within the Workflow.

At its most basic, a step looks like this:

```expressive
// Import the Workflow definitionimport { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers"type Params = {}// Create your own class that implements a Workflowexport class MyWorkflow extends WorkflowEntrypoint<Env, Params> {    // Define a run() method    async run(event: WorkflowEvent<Params>, step: WorkflowStep) {        // Define one or more steps that optionally return state.        let state = step.do("my first step", async () => {        })        step.do("my second step", async () => {        })    }}
```

Each call to `step.do` accepts three arguments:

1. (Required) A step name, which identifies the step in logs and telemetry
2. (Required) A callback function that contains the code to run for your step, and any state you want the Workflow to persist
3. (Optional) A `StepConfig` that defines the retry configuration (max retries, delay, and backoff algorithm) for the step

When trying to decide whether to break code up into more than one step, a good rule of thumb is to ask "do I want *all* of this code to run again if just one part of it fails?". In many cases, you do *not* want to repeatedly call an API if the following data processing stage fails, or if you get an error when attempting to send a completion or welcome email.

For example, each of the below tasks is ideally encapsulated in its own step, so that any failure — such as a file not existing, a third-party API being down or rate limited — does not cause your entire program to fail.

- Reading or writing files from [R2](https://developers.cloudflare.com/r2/)
- Running an AI task using [Workers AI](https://developers.cloudflare.com/workers-ai/)
- Querying a [D1 database](https://developers.cloudflare.com/d1/) or a database via [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- Calling a third-party API

If a subsequent step fails, your Workflow can retry from that step, using any state returned from a previous step. This can also help you avoid unnecessarily querying a database or calling an paid API repeatedly for data you have already fetched.

## 3\. Configure your Workflow

Before you can deploy a Workflow, you need to configure it.

Open the Wrangler file at the root of your `workflows-starter` folder, which contains the following `[[workflows]]` configuration:

- [wrangler.json](https://developers.cloudflare.com/workflows/get-started/guide/#tab-panel-1601)
- [wrangler.toml](https://developers.cloudflare.com/workflows/get-started/guide/#tab-panel-1602)

```expressive
{  "name": "workflows-starter",  "main": "src/index.ts",  "compatibility_date": "2024-10-22",  "workflows": [    {      "name": "workflows-starter",      "binding": "MY_WORKFLOW",      "class_name": "MyWorkflow"    }  ]}
```

This configuration tells the Workers platform which JavaScript class represents your Workflow, and sets a `binding` name that allows you to run the Workflow from other handlers or to call into Workflows from other Workers scripts.

## 4\. Bind to your Workflow

We have a very basic Workflow definition, but now need to provide a way to call it from within our code. A Workflow can be triggered by:

1. External HTTP requests via a `fetch()` handler
2. Messages from a [Queue](https://developers.cloudflare.com/queues/)
3. A schedule via [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
4. Via the [Workflows REST API](https://developers.cloudflare.com/api/resources/workflows/methods/list/) or [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/#workflows)

Return to the `src/index.ts` file we created in the previous step and add a `fetch` handler that *binds* to our Workflow. This binding allows us to create new Workflow instances, fetch the status of an existing Workflow, pause and/or terminate a Workflow.

```expressive
// This is in the same file as your Workflow definitionexport default {  async fetch(req: Request, env: Env): Promise<Response> {    let url = new URL(req.url);    if (url.pathname.startsWith('/favicon')) {      return Response.json({}, { status: 404 });    }    // Get the status of an existing instance, if provided    let id = url.searchParams.get('instanceId');    if (id) {      let instance = await env.MY_WORKFLOW.get(id);      return Response.json({        status: await instance.status(),      });    }    // Spawn a new instance and return the ID and status    let instance = await env.MY_WORKFLOW.create();    return Response.json({      id: instance.id,      details: await instance.status(),    });  },};
```

The code here exposes a HTTP endpoint that generates a random ID and runs the Workflow, returning the ID and the Workflow status. It also accepts an optional `instanceId` query parameter that retrieves the status of a Workflow instance by its ID.

### Review your Workflow code

Before you deploy, you can review the full Workflows code and the `fetch` handler that will allow you to trigger your Workflow over HTTP:

```expressive
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';type Env = {  // Add your bindings here, e.g. Workers KV, D1, Workers AI, etc.  MY_WORKFLOW: Workflow;};// User-defined params passed to your workflowtype Params = {  email: string;  metadata: Record<string, string>;};export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {    // Can access bindings on \`this.env\`    // Can access params on \`event.payload\`    const files = await step.do('my first step', async () => {      // Fetch a list of files from $SOME_SERVICE      return {        files: [          'doc_7392_rev3.pdf',          'report_x29_final.pdf',          'memo_2024_05_12.pdf',          'file_089_update.pdf',          'proj_alpha_v2.pdf',          'data_analysis_q2.pdf',          'notes_meeting_52.pdf',          'summary_fy24_draft.pdf',        ],      };    });    const apiResponse = await step.do('some other step', async () => {      let resp = await fetch('https://api.cloudflare.com/client/v4/ips');      return await resp.json<any>();    });    await step.sleep('wait on something', '1 minute');    await step.do(      'make a call to write that could maybe, just might, fail',      // Define a retry strategy      {        retries: {          limit: 5,          delay: '5 second',          backoff: 'exponential',        },        timeout: '15 minutes',      },      async () => {        // Do stuff here, with access to the state from our previous steps        if (Math.random() > 0.5) {          throw new Error('API call to $STORAGE_SYSTEM failed');        }      },    );  }}export default {  async fetch(req: Request, env: Env): Promise<Response> {    let url = new URL(req.url);    if (url.pathname.startsWith('/favicon')) {      return Response.json({}, { status: 404 });    }    // Get the status of an existing instance, if provided    let id = url.searchParams.get('instanceId');    if (id) {      let instance = await env.MY_WORKFLOW.get(id);      return Response.json({        status: await instance.status(),      });    }    // Spawn a new instance and return the ID and status    let instance = await env.MY_WORKFLOW.create();    return Response.json({      id: instance.id,      details: await instance.status(),    });  },};
```

## 5\. Deploy your Workflow

Deploying a Workflow is identical to deploying a Worker.

```output
# Note the "Workflows" binding mentioned here, showing that# wrangler has detected your WorkflowYour worker has access to the following bindings:- Workflows:  - MY_WORKFLOW: MyWorkflow (defined in workflows-starter)Uploaded workflows-starter (2.53 sec)Deployed workflows-starter triggers (1.12 sec)  https://workflows-starter.YOUR_WORKERS_SUBDOMAIN.workers.dev  workflow: workflows-starter
```

A Worker with a valid Workflow definition will be automatically registered by Workflows. You can list your current Workflows using Wrangler:

```expressive
npx wrangler workflows list
```

```output
Showing last 1 workflow:┌───────────────────┬───────────────────┬────────────┬─────────────────────────┬─────────────────────────┐│ Name              │ Script name       │ Class name │ Created                 │ Modified                │├───────────────────┼───────────────────┼────────────┼─────────────────────────┼─────────────────────────┤│ workflows-starter │ workflows-starter │ MyWorkflow │ 10/23/2024, 11:33:58 AM │ 10/23/2024, 11:33:58 AM │└───────────────────┴───────────────────┴────────────┴─────────────────────────┴─────────────────────────┘
```

## 6\. Run and observe your Workflow

With your Workflow deployed, you can now run it.

1. A Workflow can run in parallel: each unique invocation of a Workflow is an *instance* of that Workflow.
2. An instance will run to completion (success or failure).
3. Deploying newer versions of a Workflow will cause all instances after that point to run the newest Workflow code.

To trigger our Workflow, we will use the `wrangler` CLI and pass in an optional `--payload`. The `payload` will be passed to your Workflow's `run` method handler as an `Event`.

```expressive
npx wrangler workflows trigger workflows-starter '{"hello":"world"}'
```

```output
# Workflow instance "12dc179f-9f77-4a37-b973-709dca4189ba" has been queued successfully
```

To inspect the current status of the Workflow instance we just triggered, we can either reference it by ID or by using the keyword `latest`:

```expressive
npx wrangler@latest workflows instances describe workflows-starter latest# Or by ID:# npx wrangler@latest workflows instances describe workflows-starter 12dc179f-9f77-4a37-b973-709dca4189ba
```

```output
Workflow Name:         workflows-starterInstance Id:           f72c1648-dfa3-45ea-be66-b43d11d216f8Version Id:            cedc33a0-11fa-4c26-8a8e-7d28d381a291Status:                ✅ CompletedTrigger:               🌎 APIQueued:                10/15/2024, 1:55:31 PMSuccess:               ✅ YesStart:                 10/15/2024, 1:55:31 PMEnd:                   10/15/2024, 1:56:32 PMDuration:              1 minuteLast Successful Step:  make a call to write that could maybe, just might, fail-1Steps:  Name:      my first step-1  Type:      🎯 Step  Start:     10/15/2024, 1:55:31 PM  End:       10/15/2024, 1:55:31 PM  Duration:  0 seconds  Success:   ✅ Yes  Output:    "{\"inputParams\":[{\"timestamp\":\"2024-10-15T13:55:29.363Z\",\"payload\":{\"hello\":\"world\"}}],\"files\":[\"doc_7392_rev3.pdf\",\"report_x29_final.pdf\",\"memo_2024_05_12.pdf\",\"file_089_update.pdf\",\"proj_alpha_v2.pdf\",\"data_analysis_q2.pdf\",\"notes_meeting_52.pdf\",\"summary_fy24_draft.pdf\",\"plan_2025_outline.pdf\"]}"┌────────────────────────┬────────────────────────┬───────────┬────────────┐│ Start                  │ End                    │ Duration  │ State      │├────────────────────────┼────────────────────────┼───────────┼────────────┤│ 10/15/2024, 1:55:31 PM │ 10/15/2024, 1:55:31 PM │ 0 seconds │ ✅ Success │└────────────────────────┴────────────────────────┴───────────┴────────────┘  Name:      some other step-1  Type:      🎯 Step  Start:     10/15/2024, 1:55:31 PM  End:       10/15/2024, 1:55:31 PM  Duration:  0 seconds  Success:   ✅ Yes  Output:    "{\"result\":{\"ipv4_cidrs\":[\"173.245.48.0/20\",\"103.21.244.0/22\",\"103.22.200.0/22\",\"103.31.4.0/22\",\"141.101.64.0/18\",\"108.162.192.0/18\",\"190.93.240.0/20\",\"188.114.96.0/20\",\"197.234.240.0/22\",\"198.41.128.0/17\",\"162.158.0.0/15\",\"104.16.0.0/13\",\"104.24.0.0/14\",\"172.64.0.0/13\",\"131.0.72.0/22\"],\"ipv6_cidrs\":[\"2400:cb00::/32\",\"2606:4700::/32\",\"2803:f800::/32\",\"2405:b500::/32\",\"2405:8100::/32\",\"2a06:98c0::/29\",\"2c0f:f248::/32\"],\"etag\":\"38f79d050aa027e3be3865e495dcc9bc\"},\"success\":true,\"errors\":[],\"messages\":[]}"┌────────────────────────┬────────────────────────┬───────────┬────────────┐│ Start                  │ End                    │ Duration  │ State      │├────────────────────────┼────────────────────────┼───────────┼────────────┤│ 10/15/2024, 1:55:31 PM │ 10/15/2024, 1:55:31 PM │ 0 seconds │ ✅ Success │└────────────────────────┴────────────────────────┴───────────┴────────────┘  Name:      wait on something-1  Type:      💤 Sleeping  Start:     10/15/2024, 1:55:31 PM  End:       10/15/2024, 1:56:31 PM  Duration:  1 minute  Name:      make a call to write that could maybe, just might, fail-1  Type:      🎯 Step  Start:     10/15/2024, 1:56:31 PM  End:       10/15/2024, 1:56:32 PM  Duration:  1 second  Success:   ✅ Yes  Output:    null┌────────────────────────┬────────────────────────┬───────────┬────────────┬───────────────────────────────────────────┐│ Start                  │ End                    │ Duration  │ State      │ Error                                     │├────────────────────────┼────────────────────────┼───────────┼────────────┼───────────────────────────────────────────┤│ 10/15/2024, 1:56:31 PM │ 10/15/2024, 1:56:31 PM │ 0 seconds │ ❌ Error   │ Error: API call to $STORAGE_SYSTEM failed │├────────────────────────┼────────────────────────┼───────────┼────────────┼───────────────────────────────────────────┤│ 10/15/2024, 1:56:32 PM │ 10/15/2024, 1:56:32 PM │ 0 seconds │ ✅ Success │                                           │└────────────────────────┴────────────────────────┴───────────┴────────────┴───────────────────────────────────────────┘
```

From the output above, we can inspect:

- The status (success, failure, running) of each step
- Any state emitted by the step
- Any `sleep` state, including when the Workflow will wake up
- Retries associated with each step
- Errors, including exception messages

In the previous step, we also bound a Workers script to our Workflow. You can trigger a Workflow by visiting the (deployed) Workers script in a browser or with any HTTP client.

```expressive
# This must match the URL provided in step 6curl -s https://workflows-starter.YOUR_WORKERS_SUBDOMAIN.workers.dev/
```

```output
{"id":"16ac31e5-db9d-48ae-a58f-95b95422d0fa","details":{"status":"queued","error":null,"output":null}}
```

---

## Next steps

- Learn more about [how events are passed to a Workflow](https://developers.cloudflare.com/workflows/build/events-and-parameters/).
- Learn more about binding to and triggering Workflow instances using the [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/).
- Learn more about the [Rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/) and best practices for building applications using Workflows.

If you have any feature requests or notice any bugs, share your feedback directly with the Cloudflare team by joining the [Cloudflare Developers community on Discord ↗](https://discord.cloudflare.com/).