---
title: "Agents · Cloudflare Agents"
source: "https://developers.cloudflare.com/agents/"
author:
  - "[[Cloudflare Docs]]"
published: 2025-02-07
created: 2025-02-08
description: "Build AI-powered agents that can autonomously perform tasks, persist state, browse the web, and communicate back to users in real-time over any channel."
tags:
  - "clippings"
---
Build agents that can execute complex tasks, progressively save state, and call out to *any* third party API they need to using [Workflows](https://developers.cloudflare.com/workflows/). Send emails or [text messages](https://developers.cloudflare.com/workflows/examples/twilio/), [browse the web](https://developers.cloudflare.com/browser-rendering/), process and summarize documents, and/or query your database.

```expressive
npm create cloudflare@latest workflows-starter -- --template "cloudflare/workflows-starter"cd workflows-starternpm i resend
```

```expressive
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';import { Resend } from 'resend';type Env = {  MY_WORKFLOW: Workflow;  RESEND_API_KEY: string;};type Params = {  email: string;  metadata: Record<string, string>;};export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {    const files = await step.do('my first step', async () => {      // Fetch a list of files from $SOME_SERVICE      return {        files: [          'doc_7392_rev3.pdf',          'report_x29_final.pdf',          'memo_2024_05_12.pdf',          'file_089_update.pdf',          'proj_alpha_v2.pdf',          'data_analysis_q2.pdf',          'notes_meeting_52.pdf',          'summary_fy24_draft.pdf',        ],79 collapsed lines      };    });    const summaries = await step.do('summarize text', async () => {      const results = {};      for (const filename of files.files) {        const fileContent = await this.env.MY_BUCKET.get(filename);        if (!fileContent) continue;        const text = await fileContent.text();        const summary = await this.env.WORKERS_AI.run('@cf/meta/llama-3.2-3b-instruct', {          messages: [{            role: 'user',            content: \`Please summarize the following text concisely: ${text}\`          }]        });        results[filename] = summary.response;      }      return results;    });    await step.sleep('wait on something', '1 minute');    let summaryKey = await step.do(      'store summaries in R2',      async () => {        const summaryKey = \`summaries-${Date.now()}.json\`;        await this.env.MY_BUCKET.put(summaryKey, JSON.stringify(summaries));        return summaryKey;      },    );    await step.do(      'email summaries',      {        retries: {          limit: 3,          delay: '5 second',          backoff: 'exponential',        }      },      async () => {        const summaryText = Object.entries(summaries)          .map(([filename, summary]) => \`${filename}:\n${summary}\n\n\`)          .join('');        const resend = new Resend(this.env.RESEND_API_KEY);        await resend.emails.send({          from: 'notifications@yourdomain.com',          to: event.payload.email,          subject: 'Your Document Summaries',          text: summaryText,        });      }    );    return summaryKey;  }}export default {  async fetch(req: Request, env: Env): Promise<Response> {    let id = new URL(req.url).searchParams.get('instanceId');    if (id) {      let instance = await env.MY_WORKFLOW.get(id);      return Response.json({        status: await instance.status(),      });    }    let instance = await env.MY_WORKFLOW.create();    return Response.json({      id: instance.id,      details: await instance.status(),    });  },};
```