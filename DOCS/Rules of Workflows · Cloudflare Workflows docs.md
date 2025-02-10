---
title: "Rules of Workflows · Cloudflare Workflows docs"
source: "https://developers.cloudflare.com/workflows/build/rules-of-workflows/"
author:
  - "[[Cloudflare Docs]]"
published: 2025-01-31
created: 2025-02-08
description: "A Workflow contains one or more steps. Each step is a self-contained, individually retriable component of a Workflow. Steps may emit (optional) state that allows a Workflow to persist and continue from that step, even if a Workflow fails due to a network or infrastructure issue."
tags:
  - "clippings"
---
A Workflow contains one or more steps. Each step is a self-contained, individually retriable component of a Workflow. Steps may emit (optional) state that allows a Workflow to persist and continue from that step, even if a Workflow fails due to a network or infrastructure issue.

This is a small guidebook on how to build more resilient and correct Workflows.

### Ensure API/Binding calls are idempotent

Because a step might be retried multiple times, your steps should (ideally) be idempotent. For context, idempotency is a logical property where the operation (in this case a step), can be applied multiple times without changing the result beyond the initial application.

As an example, let us assume you have a Workflow that charges your customers, and you really do not want to charge them twice by accident. Before charging them, you should check if they were already charged:

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1577)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1578)

```expressive
export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    const customer_id = 123456;    // ✅ Good: Non-idempotent API/Binding calls are always done **after** checking if the operation is    // still needed.    await step.do(      \`charge ${customer_id} for its monthly subscription\`,      async () => {        // API call to check if customer was already charged        const subscription = await fetch(          \`https://payment.processor/subscriptions/${customer_id}\`,        ).then((res) => res.json());        // return early if the customer was already charged, this can happen if the destination service dies        // in the middle of the request but still commits it, or if the Workflows Engine restarts.        if (subscription.charged) {          return;        }        // non-idempotent call, this operation can fail and retry but still commit in the payment        // processor - which means that, on retry, it would mischarge the customer again if the above checks        // were not in place.        return await fetch(          \`https://payment.processor/subscriptions/${customer_id}\`,          {            method: "POST",            body: JSON.stringify({ amount: 10.0 }),          },        );      },    );  }}
```

### Make your steps granular

Steps should be as self-contained as possible. This allows your own logic to be more durable in case of failures in third-party APIs, network errors, and so on.

You can also think of it as a transaction, or a unit of work.

- ✅ Minimize the number of API/binding calls per step (unless you need multiple calls to prove idempotency).

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1575)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1576)

```expressive
export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    // ✅ Good: Unrelated API/Binding calls are self-contained, so that in case one of them fails    // it can retry them individually. It also has an extra advantage: you can control retry or    // timeout policies for each granular step - you might not to want to overload http.cat in    // case of it being down.    const httpCat = await step.do("get cutest cat from KV", async () => {      return await env.KV.get("cutest-http-cat");    });    const image = await step.do("fetch cat image from http.cat", async () => {      return await fetch(\`https://http.cat/${httpCat}\`);    });  }}
```

Otherwise, your entire Workflow might not be as durable as you might think, and you may encounter some undefined behaviour. You can avoid them by following the rules below:

- 🔴 Do not encapsulate your entire logic in one single step.
- 🔴 Do not call separate services in the same step (unless you need it to prove idempotency).
- 🔴 Do not make too many service calls in the same step (unless you need it to prove idempotency).
- 🔴 Do not do too much CPU-intensive work inside a single step - sometimes the engine may have to restart, and it will start over from the beginning of that step.

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1573)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1574)

```expressive
export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    // 🔴 Bad: you are calling two separate services from within the same step. This might cause    // some extra calls to the first service in case the second one fails, and in some cases, makes    // the step non-idempotent altogether    const image = await step.do("get cutest cat from KV", async () => {      const httpCat = await env.KV.get("cutest-http-cat");      return fetch(\`https://http.cat/${httpCat}\`);    });  }}
```

### Do not rely on state outside of a step

Workflows may hibernate and lose all in-memory state. This will happen when engine detects that there is no pending work and can hibernate until it needs to wake-up (because of a sleep, retry, or event).

This means that you should not store state outside of a step:

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1585)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1586)

```expressive
function getRandomInt(min, max) {  const minCeiled = Math.ceil(min);  const maxFloored = Math.floor(max);  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive}export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    // 🔴 Bad: \`imageList\` will be not persisted across engine's lifetimes. Which means that after hibernation,    // \`imageList\` will be empty again, even though the following two steps have already ran.    const imageList = [];    await step.do("get first cutest cat from KV", async () => {      const httpCat = await env.KV.get("cutest-http-cat-1");      imageList.append(httpCat);    });    await step.do("get second cutest cat from KV", async () => {      const httpCat = await env.KV.get("cutest-http-cat-2");      imageList.append(httpCat);    });    // A long sleep can (and probably will) hibernate the engine which means that the first engine lifetime ends here    await step.sleep("💤💤💤💤", "3 hours");    // When this runs, it will be on the second engine lifetime - which means \`imageList\` will be empty.    await step.do(      "choose a random cat from the list and download it",      async () => {        const randomCat = imageList.at(getRandomInt(0, imageList.length));        // this will fail since \`randomCat\` is undefined because \`imageList\` is empty        return await fetch(\`https://http.cat/${randomCat}\`);      },    );  }}
```

Instead, you should build top-level state exclusively comprised of `step.do` returns:

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1583)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1584)

```expressive
function getRandomInt(min, max) {  const minCeiled = Math.ceil(min);  const maxFloored = Math.floor(max);  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive}export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    // ✅ Good: imageList state is exclusively comprised of step returns - this means that in the event of    // multiple engine lifetimes, imageList will be built accordingly    const imageList = await Promise.all([      step.do("get first cutest cat from KV", async () => {        return await env.KV.get("cutest-http-cat-1");      }),      step.do("get second cutest cat from KV", async () => {        return await env.KV.get("cutest-http-cat-2");      }),    ]);    // A long sleep can (and probably will) hibernate the engine which means that the first engine lifetime ends here    await step.sleep("💤💤💤💤", "3 hours");    // When this runs, it will be on the second engine lifetime - but this time, imageList will contain    // the two most cutest cats    await step.do(      "choose a random cat from the list and download it",      async () => {        const randomCat = imageList.at(getRandomInt(0, imageList.length));        // this will eventually succeed since \`randomCat\` is defined        return await fetch(\`https://http.cat/${randomCat}\`);      },    );  }}
```

### Do not mutate your incoming events

The `event` passed to your Workflow's `run` method is immutable: changes you make to the event are not persisted across steps and/or Workflow restarts.

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1579)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1580)

```expressive
export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    // 🔴 Bad: Mutating the event    // This will not be persisted across steps and \`event.payload\` will    // take on its original value.    await step.do("bad step that mutates the incoming event", async () => {      let userData = await env.KV.get(event.payload.user);      event.payload = userData;    });    // ✅ Good: persist data by returning it as state from your step    // Use that state in subsequent steps    let userData = await step.do("good step that returns state", async () => {      return await env.KV.get(event.payload.user);    });    let someOtherData = await step.do(      "following step that uses that state",      async () => {        // Access to userData here        // Will always be the same if this step is retried      },    );  }}
```

### Name steps deterministically

Steps should be named deterministically (ie, not using the current date/time, randomness, etc). This ensures that their state is cached, and prevents the step from being rerun unnecessarily. Step names act as the "cache key" in your Workflow.

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1587)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1588)

```expressive
export class MyWorkflow extends WorkflowEntrypoint {  async run(event, step) {    // 🔴 Bad: Naming the step non-deterministically prevents it from being cached    // This will cause the step to be re-run if subsequent steps fail.    await step.do(\`step #1 running at: ${Date.now()}\`, async () => {      let userData = await env.KV.get(event.payload.user);      // Do not mutate event.payload      event.payload = userData;    });    // ✅ Good: give steps a deterministic name.    // Return dynamic values in your state, or log them instead.    let state = await step.do("fetch user data from KV", async () => {      let userData = await env.KV.get(event.payload.user);      console.log(\`fetched at ${Date.now}\`);      return userData;    });    // ✅ Good: steps that are dynamically named are constructed in a deterministic way.    // In this case, \`catList\` is a step output, which is stable, and \`catList\` is    // traversed in a deterministic fashion (no shuffles or random accesses) so,    // it's fine to dynamically name steps (e.g: create a step per list entry).    let catList = await step.do("get cat list from KV", async () => {      return await env.KV.get("cat-list");    });    for (const cat of catList) {      await step.do(\`get cat: ${cat}\`, async () => {        return await env.KV.get(cat);      });    }  }}
```

### Instance IDs are unique

Workflow [instance IDs](https://developers.cloudflare.com/workflows/build/workers-api/#workflowinstance) are unique per Workflow. The ID is the unique identifier that associates logs, metrics, state and status of a run to a specific an instance, even after completion. Allowing ID re-use would make it hard to understand if a Workflow instance ID referred to an instance that run yesterday, last week or today.

It would also present a problem if you wanted to run multiple different Workflow instances with different [input parameters](https://developers.cloudflare.com/workflows/build/events-and-parameters/) for the same user ID, as you would immediately need to determine a new ID mapping.

If you need to associate multiple instances with a specific user, merchant or other "customer" ID in your system, consider using a composite ID or using randomly generated IDs and storing the mapping in a database like [D1](https://developers.cloudflare.com/d1/).

- [JavaScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1581)
- [TypeScript](https://developers.cloudflare.com/workflows/build/rules-of-workflows/#tab-panel-1582)

```expressive
// This is in the same file as your Workflow definitionexport default {  async fetch(req, env) {    // 🔴 Bad: Use an ID that isn't unique across future Workflow invocations    let userId = getUserId(req); // Returns the userId    let badInstance = await env.MY_WORKFLOW.create({      id: userId,      params: payload,    });    // ✅ Good: use an ID that is unique    // e.g. a transaction ID, order ID, or task ID are good options    let instanceId = getTransactionId(); // e.g. assuming transaction IDs are unique    // or: compose a composite ID and store it in your database    // so that you can track all instances associated with a specific user or merchant.    instanceId = \`${getUserId(request)}-${await crypto.randomUUID().slice(0, 6)}\`;    let { result } = await addNewInstanceToDB(userId, instanceId);    let goodInstance = await env.MY_WORKFLOW.create({      id: userId,      params: payload,    });    return Response.json({      id: goodInstance.id,      details: await goodInstance.status(),    });  },};
```