---
title: "Sergey's Blog"
source: "https://www.sergey.fyi/articles/gemini-flash-2"
author:
published: 2025-01-15
created: 2025-02-08
description: "Sergey Filimonov's blog"
tags:
  - "clippings"
---
Chunking PDFs—converting them into neat, machine-readable text chunks—is a major headache for any RAG systems. Both open-source and proprietary solutions exist, but none have truly achieved the ideal combination of accuracy, scalability, and cost-effectiveness.

1. Existing [end-to-end models](https://github.com/facebookresearch/nougat) struggle with non trivial layouts found in real-world documents. Other open-source solutions usually involve orchestrating multiple specialized ML models for layout detection, table parsing, and markdown conversion. A case in point: NVIDIA’s [nv-ingest](https://github.com/NVIDIA/nv-ingest) requires spinning up a Kubernetes cluster with eight services and two A/H100 GPUs. This becomes incredibly cumbersome to orchestrate and performance remains suboptimal.
2. Despite their cost, many proprietary solutions still struggle with complex layouts and achieving consistent accuracy. Furthermore, the expenses become astronomical when dealing with large datasets. For our needs – parsing hundreds of millions of pages – the price tag from vendors is simply unsustainable.

Large foundational models seem like a natural fit for this task. However, they have yet to prove more cost-effective than proprietary solutions, and their subtle inconsistencies pose significant challenges for real-world use. For instance, GPT-4o will often generate spurious cell artifacts within tables, making it challenging to use in production.

Enter [Gemini Flash 2.0](https://deepmind.google/technologies/gemini/flash/).

While in my opinion the developer experience with Google still lags behind OpenAI, their cost-effectiveness is impossible to ignore. Unlike 1.5 Flash, which had subtle inconsistencies that made it difficult to rely on in production, our internal testing shows Gemini Flash 2.0 achieves near-perfect OCR accuracy while being still being incredibly cheap.

| **Provider** | **Model** | **PDF to Markdown, Pages per Dollar** |
| --- | --- | --- |
| [Gemini](https://cloud.google.com/vertex-ai/generative-ai/pricing) | 2.0 Flash | 🏆 **≈ 6,000** |
| [Gemini](https://cloud.google.com/vertex-ai/generative-ai/pricing) | 2.0 Flash Lite | ≈ 12,000 *(have not tested this yet)* |
| [Gemini](https://cloud.google.com/vertex-ai/generative-ai/pricing) | 1.5 Flash | ≈ 10,000 |
| [AWS Textract](https://aws.amazon.com/textract/) | Commercial | ≈ 1000 |
| [Gemini](https://cloud.google.com/vertex-ai/generative-ai/pricing) | 1.5 Pro | ≈ 700 |
| [OpenAI](https://openai.com/api/pricing/) | 4o-mini | ≈ 450 |
| [LlamaParse](https://docs.llamaindex.ai/en/stable/llama_cloud/llama_parse/) | Commercial | ≈ 300 |
| [OpenAI](https://openai.com/api/pricing/) | 4o | ≈ 200 |
| [Anthropic](https://www.anthropic.com/pricing) | claude-3-5-sonnet | ≈ 100 |
| [Reducto](https://reducto.ai/) | Commercial | ≈ 100 |
| [Chunkr](https://chunkr.ai/) | Commercial | ≈ 100 |

\*\* *All LLM providers are quoted with their batch pricing \[2\].*

## Does this come at the expense of lower accuracy?

Of all the steps in document parsing, table identification and extraction is the most challenging. Complex layouts, unconventional formatting, and inconsistent data quality make reliable extraction difficult.

As a result, this is a great place to evaluate performance. We use a subset of Reducto’s [rd-tablebench](https://github.com/Filimoa/rd-tablebench), which tests models against real-world challenges like poor scans, multiple languages, and intricate table structures—far beyond the tidy examples typical in academic benchmarks.

The results are below (accuracy is measured with the [Needleman-Wunsch algorithm](https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm)).

| **Provider** | **Model** | **Accuracy** | **Comment** |
| --- | --- | --- | --- |
| Reducto |  | 0.90 ± 0.10 |  |
| Gemini | 2.0 Flash | 0.84 ± 0.16 | *near perfect* |
| Anthropic | Sonnet | 0.84 ± 0.16 |  |
| AWS Textract |  | 0.81 ± 0.16 |  |
| Gemini | 1.5 Pro | 0.80 ± 0.16 |  |
| Gemini | 1.5 Flash | 0.77 ± 0.17 |  |
| OpenAI | 4o | 0.76 ± 0.18 | *subtle numerical hallucinations* |
| OpenAI | 4o-mini | 0.67 ± 0.19 | *poor* |
| Gcloud |  | 0.65 ± 0.23 |  |
| Chunkr |  | 0.62 ± 0.21 |  |

Reducto's own model currently outperforms Gemini Flash 2.0 on this benchmark (0.90 vs 0.84). However, as we review the lower-performing examples, most discrepancies turn out to be minor structural variations that would not materially affect an LLM’s understanding of the table.

Crucially, we’ve seen very few instances where specific numerical values are actually misread. This suggests that most of Gemini’s “errors” are superficial formatting choices rather than substantive inaccuracies. We attach examples of these failure cases below \[1\].

Beyond table parsing, Gemini consistently delivers near-perfect accuracy across all other facets of PDF-to-markdown conversion. If you combine all this together, you’re left with a indexing pipeline that exceedingly simple, scalable and cheap.

## What if we add chunking?

Markdown extraction is just the first step. For documents to be effectively used in RAG pipelines, they must be split into smaller, semantically meaningful chunks.

[Recent studies](https://research.trychroma.com/evaluating-chunking) have shown that using large language models (LLMs) for this task can outperform other strategies in terms of retrieval accuracy. This intuitively makes sense - LLMs excel at understanding context and identifying natural boundaries in text, making them well-suited for generating semantically meaningful chunks.

The problem? Cost. Until now, LLM-based chunking has been prohibitively expensive. With Gemini Flash 2.0, however, the game changes again - it's pricing makes it feasible to use it to chunk documents at scale.

We can parse our 100+ million-page corpus for $5,000 with Gemini Flash 2.0, which is less than the monthly bill for [several vector DB hosts](https://cloud.qdrant.io/calculator?provider=aws&region=us-east-1&vectors=100000000&dimension=1536&storageOptimized=false&replicas=1&quantization=None&storageRAMCachePercentage=35).

You could even imagine combining chunking with markdown extraction and based off our very limited testing, the results seem effective with no impact on extraction quality.

```python
CHUNKING_PROMPT = """\
OCR the following page into Markdown. Tables should be formatted as HTML. 
Do not sorround your output with triple backticks.

Chunk the document into sections of roughly 250 - 1000 words. Our goal is 
to identify parts of the page with same semantic theme. These chunks will 
be embedded and used in a RAG pipeline. 

Surround the chunks with <chunk> </chunk> html tags.
"""
```

## But we’ve lost bounding boxes?

While markdown extraction and chunking solve many problems in document parsing, they introduce a critical limitation: the loss of bounding box information. This means users can no longer see where specific information resides in the original document. Instead citations end up pointing to a generic page number or isolated excerpts.

This creates a trust gap. Bounding boxes are essential for linking extracted information back to its exact location in the source PDF, providing users with confidence that the data was not hallucinated.

This is probably my biggest complaint with the overwhelming majority of chunking libraries.

![Carousel slide 0](https://www.sergey.fyi/_next/image?url=%2Fimages%2Fgemini-flash-2%2Fcitations-example.webp&w=1920&q=75)

This our app with an example citation being displayed within the context of the source document.

But there's a promising idea here - LLMs have shown remarkable spatial understanding, (check out [Simon Willis’s example of Gemini generating accurate bounding boxes for a densely packed flock of birds](https://simonwillison.net/2024/Dec/11/gemini-2/)). You'd think it could be leveraged to precisely map text to its location within a document.

This was big hope of ours. Unfortunately Gemini really seems to struggle on this, and no matter how we tried prompting it, it would generate wildly inaccurate bounding boxes, suggesting that document layout understanding is underrepresented in its training data. That said, this really seems like a temporary problem.

If Google, incorporates more document-specific data during training—or fine-tuning with a focus on document layouts— we could likely bridge this gap fairly easily. The potential is undeniable.

```python
GET_NODE_BOUNDING_BOXES_PROMPT = """\
Please provide me strict bounding boxes that encompasses the following text in the attached image? I'm trying to draw a rectangle around the text.
- Use the top-left coordinate system
- Values should be percentages of the image width and height (0 to 1)

{nodes}
"""
```

![Carousel slide 1](https://www.sergey.fyi/_next/image?url=%2Fimages%2Fgemini-flash-2%2Fgemini-bboxes-meta-10k.webp&w=1920&q=75)

Gemini really struggles here.

\*\* *This is just an example prompt, we tried quite a few different methods here, but nothing seems to work (as of January 2025).*

## Why this matters

By uniting these solutions, we’ve crafted an indexing pipeline that’s both elegant and economical at scale. We’ll be eventually be open sourcing our work on this, although I’m sure many others will implement similar libraries.

Importantly, once we solve these three challenges of parsing, chunking and bounding box detection we’ve effectively “solved” document ingestions into LLM’s (with caveats). This progress brings us tantalizingly close to a future where document parsing is not just efficient but practically effortless for any use case.

*PS: If you happen to work at Google and have recommendations around the AI Startup credits program, [we'd love to chat](https://www.sergey.fyi/articles/).*

---

## Footnotes:

\[1\] Looking at failure cases. We compared the HTML outputs of Gemini vs Reducto vs the source PDF.

![Reducto Bench Example](https://www.sergey.fyi/images/gemini-flash-2/rd-bench-example.webp)

\[2\] I've gotten questions on this so here's how I've broken down the cost of Gemini Flash 2.0. Input Image Cost - $0.00009675 per image. Output Cost - $0.0000525 per 400 tokens. This translates to **6,379 pages per dollar**. Densely packed pages may cost more, but this provides a solid estimate. For more details, check out [Vertex's batch pricing page](https://cloud.google.com/vertex-ai/generative-ai/pricing#token-based-pricing).