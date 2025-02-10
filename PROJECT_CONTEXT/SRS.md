
---
title: "Backend SRS: Edge-Based Agent Backend for BoardAIssistant.ai"
source: "Internal – based on Cloudflare Workers, Durable Objects, AI SDK, Gemini Flash, unstructured.io, and Fleet demo code"
author:
  - "[[Your Name]]"
published: 2025-02-08
created: 2025-02-08
description: "Software Requirements Specification for the new distributed agent backend on Cloudflare. This document details the full implementation plan with code references and technical design notes."
tags:
  - "SRS"
  - "Backend"
  - "Cloudflare"
  - "Durable Objects"
  - "Edge Computing"
---

# 1. Introduction

This document defines the technical requirements and implementation details for migrating BoardAIssistant.ai’s backend to a fully composable, edge-based architecture using Cloudflare Workers and Durable Objects. The system will integrate the AI SDK for LLM interactions, leverage Gemini Flash and unstructured.io for document content extraction, and provide a hierarchical, URL-driven state management model.

# 2. System Architecture

## 2.1 Overview

The new backend is based on a hierarchy of Durable Objects (DOs) that maps directly to organizational and meeting structures. The key components are:

- **Root DO:** Global manager for configuration and routing.
- **Company DO:** Represents each company, stores corporate policies, and manages board instances.
- **Board DO:** Represents individual boards within a company.
- **Meeting DO:** Central DO for each board meeting that handles document uploads, AI analysis, report generation, and user annotations.
- **Section/Topic DOs (Optional):** Further subdivisions for comparing specific document sections across meetings.

## 2.2 Data Flow and Storage

- **File Uploads:** Documents are uploaded via the Next.js 15 app router and sent to a Cloudflare Worker endpoint. Files are stored in Cloudflare R2; DOs store only metadata and pointers.
- **State Persistence:** Durable Objects maintain all meeting-specific state (uploaded file metadata, analysis results, annotations).
- **Real-time Updates:** WebSockets are used for pushing live updates (analysis progress, HITL confirmations) from DOs to the frontend.
- **Caching:** KV is used for transient caching (e.g., user session state, temporary processing results).
- **Relational Data:** D1 may be used for queries that require relational joins (e.g., mapping meetings to companies).

# 3. Functional Requirements

## 3.1 Document Ingestion and Processing

- **Upload Endpoint:** A Cloudflare Worker route (see `src/index.ts`) receives file uploads.
  - _Reference:_ In Fleet demo, `src/index.ts` routes requests based on URL path.
- **Storage:** Files are stored in R2; metadata (file name, upload date, pointer URL) is stored in the corresponding Meeting DO.
- **Processing Trigger:** Upon successful upload, the Meeting DO triggers a workflow to:
  - Call Gemini Flash (via Workers AI bindings) for OCR.
  - Use unstructured.io to convert complex layouts into markdown.
- **API Design:** Use Hono for routing. Example snippet:
  ```ts
  // src/index.ts – Worker router snippet
  import { Hono } from 'hono';
  const app = new Hono();
  app.post('/upload', async (c) => {
    // Validate file upload and store in R2
    // Instantiate or route to the appropriate Meeting DO based on URL
    // Return upload status
  });
  export default { fetch: app.fetch };

3.2 Hierarchical DO Management
	•	Routing: The URL structure (e.g., /companyA/board1/meeting20241026) is parsed to derive a unique DO ID for each segment.
	•	Reference: Fleet demo’s hierarchical routing in src/index.ts.
	•	DO Implementation: Each DO implements:
	•	A fetch(request) method that handles HTTP and WebSocket connections.
	•	Internal state management using DO storage.
	•	Methods for:
	•	Handling file uploads.
	•	Invoking AI SDK tool calls (with optional HITL steps).
	•	Managing analysis results and user annotations.
	•	Example:

// src/index.ts – Durable Object implementation snippet
export class MeetingDO {
  constructor(private state: DurableObjectState, private env: Env) { }
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname.endsWith('/upload')) {
      // Process file upload, store pointer in state
    } else if (url.pathname.includes('/_ws')) {
      // Handle WebSocket connections for real-time updates
    }
    // ... other endpoints (e.g., report generation, HITL confirmation)
  }
}


	•	Hierarchy Management: The Root DO instantiates and manages Company DOs; Company DOs instantiate Board DOs; Board DOs instantiate Meeting DOs.

3.3 AI Workflow and HITL Integration
	•	Tool Invocation: Meeting DOs call out to the AI SDK for tasks such as “Data Inconsistency” analysis.
	•	HITL Functionality: For sensitive tool calls, a confirmation step is inserted.
	•	Reference: See “Human-in-the-Loop with Next.js.md” and the utility functions in our DOCS.
	•	The DO inspects tool calls, and if a tool (e.g., getWeatherInformation in the demo) requires confirmation, the DO pauses and sends a WebSocket message to the client.
	•	Processing Utility Functions: We will create utility functions (in a new file, e.g., backend/utils/hitl.ts) that mirror the abstraction described in our brainstorming notes. This file will export functions like processToolCalls and constants for approval states.

// Example from our HITL abstraction utility
export const APPROVAL = { YES: 'Yes, confirmed.', NO: 'No, denied.' } as const;
export async function processToolCalls({ messages, dataStream, tools }, executeFunctions) {
  // Process messages, detect pending tool calls, and execute if approved.
}


	•	LLM Calls: Use Workers AI to call LLMs (e.g., GPT‑4 via OpenAI or Gemini Flash via a dedicated endpoint) with appropriate prompts and parse results. Code references come from our DOCS/AI SDK and Agents markdown files.

3.4 Real-time Communication
	•	WebSockets: Durable Objects open WebSocket connections for:
	•	Pushing status updates (upload progress, AI analysis status).
	•	Delivering HITL confirmation requests.
	•	Broadcasting state changes to connected clients.
	•	Reference: See public/ui.js in the Fleet demo for WebSocket handling.

4. Non-Functional Requirements
	•	Performance: All endpoints should aim for sub‑100ms latency for routine operations.
	•	Scalability: The system must support a 10× increase in concurrent meeting analyses.
	•	Security:
	•	Use Cloudflare’s built‑in isolation for DOs.
	•	Maintain strict access controls at each hierarchical level.
	•	Ensure that service‑role keys (for R2/D1) are never exposed client‑side.
	•	Type Safety: Use TypeScript throughout the codebase to enforce type‑safety, especially in inter‑DO communications.
	•	Observability: Instrument endpoints with Cloudflare Logs and set up monitoring for DO performance and WebSocket connection health.

5. Code References and Files
	•	src/index.ts:
	•	Contains the Hono-based router and DO instantiation logic.
	•	Implements hierarchical routing (see Fleet demo example).
	•	public/ui.js:
	•	Updated to reflect our new UI for BoardAIssistant.ai with hierarchical navigation.
	•	backend/utils/hitl.ts:
	•	Contains utility functions for processing tool calls and handling HITL confirmations.
	•	wrangler.example.toml:
	•	Updated configuration with DO bindings (e.g., FLEET_DO renamed or extended for our hierarchical system).
	•	DOCS/Human-in-the-Loop with Next.js.md:
	•	Reference for implementing HITL confirmations in our agent workflows.

6. Migration and Rollout Strategy
	•	Phase 1:
	•	Develop a proof‑of‑concept that implements a Root DO, a Company DO, and a Meeting DO.
	•	Migrate one sample company’s meeting documents to R2 and test LLM integration using Gemini Flash.
	•	Phase 2:
	•	Expand the hierarchy to include Board DOs and optionally Section DOs.
	•	Integrate WebSocket endpoints and HITL flows.
	•	Phase 3:
	•	Update the Next.js frontend to use the new hierarchical endpoints.
	•	Run parallel tests with the existing Supabase/Next.js backend.
	•	Phase 4:
	•	Gradually migrate live data and users; monitor performance and cost metrics.

7. Conclusion

This SRS details the technical requirements and implementation strategy for migrating BoardAIssistant.ai’s backend to a fully composable, edge‑based architecture using Cloudflare Workers and Durable Objects. The hierarchical design not only meets our performance and scalability goals but also lays the groundwork for advanced document analysis workflows and real‑time human‑in‑the‑loop interaction.

Feedback on these requirements and the proposed code organization is requested before proceeding to full-scale development.
