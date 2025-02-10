
---
title: "Composable AI Architecture for BoardAIssistant.ai"
source: "Internal – based on Cloudflare Agents, AI SDK, Gemini Flash & unstructured.io docs"
author:
  - "[[Your Name]]"
published: 2025-02-08
created: 2025-02-08
description: "A comprehensive blueprint for migrating BoardAIssistant.ai to a fully composable, edge-based distributed system using Cloudflare Workers, Durable Objects, and advanced document extraction models."
tags:
  - "PRD"
  - "Edge Computing"
  - "AI Agents"
  - "Cloudflare"
  - "Distributed Systems"
---

## 1. Overview

BoardAIssistant.ai is our next‑generation board assistant platform designed to reduce director liability and enhance board decision‑making by processing extensive board materials with AI. Our current system uses Supabase with Next.js API routes and the AI SDK; however, increasing load and the need for near‑real-time, low‑latency responses have prompted us to re‑architect our backend. This PRD proposes a migration to a fully composable, edge‑based system built on Cloudflare’s Workers platform with a hierarchy of Durable Objects (DOs), integrated with advanced document extraction via Gemini Flash and unstructured.io.

## 2. Problem Statement

Our existing system exhibits several challenges:
- **Latency & Scalability:** Centralized API routes and Supabase storage introduce delays and limit concurrent processing.
- **Document Processing Complexity:** Ingesting and accurately parsing millions of board documents (PDFs, reports, minutes) at scale is cost‑inefficient with our current tools.
- **Lack of Persistent Agent Workflows:** We currently lack a state‑aware, hierarchical agent system that can manage long‑running document analysis workflows.
- **Human-in-the-Loop (HITL) Limitations:** Our ad‑hoc HITL functionality needs a robust, type‑safe abstraction to approve critical AI actions.

## 3. Objectives

- **Reduce Latency:** Achieve sub‑100ms API responses using edge‑compute.
- **Enhance Scalability:** Scale horizontally by employing a hierarchical structure of Durable Objects.
- **Improve Document Extraction:** Integrate Gemini Flash and unstructured.io to perform highly accurate, cost‑effective content extraction.
- **Enable Robust HITL:** Build modular HITL confirmations into tool invocations for sensitive actions.
- **Maintain Developer Productivity:** Use TypeScript and modern tooling (Wrangler, Hono) to ensure a type‑safe, maintainable codebase with a clear migration path from our current Supabase/Next.js setup.

## 4. Proposed Architecture & Hierarchy

The core concept is to use a **hierarchy of Durable Objects** (DOs) driven by URL paths. Each segment of the URL (e.g., `/companyA/board1/meeting20241026`) maps to a specific, persistent DO. The key components are:

### 4.1 Root DO (/)
- **Role:** System manager.
- **Responsibilities:**
  - Global configuration and settings.
  - Pre‑loaded corporate governance principles (OECD, Basel, etc.).
  - Routing user requests to the correct company instance.
  - (Optionally) basic authentication “gateway” functions.

### 4.2 Company DOs (/companyA, /companyB, …)
- **Role:** Manage company‑specific data.
- **Responsibilities:**
  - Store corporate policies (CSR, Code of Conduct, Diversity).
  - Maintain a list of boards (and associated user access controls).
  - Manage settings such as company news scraping (as per slide 16).

### 4.3 Board DOs (/companyA/board1, /companyA/board2)
- **Role:** Represent individual boards (e.g., main board, audit committee).
- **Responsibilities:**
  - Inherit corporate policies from the Company DO.
  - Maintain a roster of board meetings.
  - Possibly store board‑level analytics or historical data.

### 4.4 Meeting DOs (/companyA/board1/meeting20241026, /companyA/board1/meeting20241102)
- **Role:** Central to meeting-specific workflows.
- **Responsibilities:**
  - **Document Upload & Storage:** Accept board material uploads (pre‑reads, minutes, reports); store metadata and pointers to files in R2.
  - **Document Processing & Analysis:** Trigger AI workflows (data inconsistency, fact check, missing information) via the AI SDK and LLM calls.
  - **Results & Annotations:** Store AI analysis results, user annotations, and allow for modifications (e.g., “add to report” actions).
  - **Email Generation:** Generate draft emails based on analysis (mapping to demo step 5).
  - **Repository Functionality:** Maintain a persistent “paper trail” for each meeting.

### 4.5 Section/Topic DOs (Optional/Future)
- **Role:** Provide deeper granularity (e.g., finances, risk, legal).
- **Responsibilities:**
  - Enable side‑by‑side comparisons of similar sections across meetings.
  - Support targeted queries on specific topics.

## 5. Workflow Mapping

The new architecture maps directly to our demo workflow:

1. **Step 1 – Upload:**
   - The UI routes the file upload to the appropriate Meeting DO (e.g., `/companyA/board1/meeting20241026`), which stores the file in R2 and records metadata in its state.
2. **Step 2 – Data Crunch Options:**
   - The Meeting DO exposes pre‑defined prompts (stored internally) to instruct the LLM on various analyses.
3. **Step 3 – Data Inconsistency:**
   - On selecting “Data Inconsistency,” the Meeting DO sends the uploaded document (or its extracted text) along with the prompt to the LLM via Workers AI.
4. **Step 4 – Results:**
   - The LLM response is streamed back (via WebSockets) and stored within the Meeting DO, with options for user annotations and “add to report” actions.
5. **Step 5 – Email Generation:**
   - Triggering an “Add to report” action instructs the Meeting DO to generate a draft email using the analysis results, which is then delivered to the user interface.

## 6. Advantages and Tradeoffs

**Advantages:**
- **Persistence & Traceability:** Every meeting has its own DO to maintain a permanent record of documents, analysis, and user actions.
- **Isolation & Security:** Data is compartmentalized by company/board/meeting, reducing risk of leakage.
- **Real-time Collaboration:** WebSocket integration enables live updates and possible concurrent edits.
- **Scalability & Low Latency:** Running on Cloudflare’s global edge reduces response time and handles large loads.
- **Versioning:** Each update in the DO can be versioned, ensuring traceability.

**Challenges:**
- **Increased Complexity:** Managing a hierarchical DO system is inherently more complex than a monolithic architecture.
- **LLM Integration & Cost:** Ensuring robust, cost‑effective integration with Gemini Flash and unstructured.io requires careful prompt engineering and API cost management.
- **UI/UX Redesign:** The front‑end must evolve from a basic Fleet demo to a polished, hierarchical interface.
- **Security & Data Migration:** Migrating legacy data from Supabase and ensuring secure, isolated access requires careful planning.

## 7. Conclusion

By adopting a hierarchical Durable Objects architecture, BoardAIssistant.ai can achieve the scalability, low‑latency, and persistent state required for deep document analysis and real‑time collaboration. This proposal provides a roadmap for migrating our current Supabase/Next.js/AI SDK solution to a fully edge‑based system leveraging Cloudflare’s Workers, Durable Objects, and modern AI extraction tools.

Feedback is requested on the proposed architecture and workflow mapping before we proceed to the detailed backend implementation.
