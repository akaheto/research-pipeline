# Technical Specification: Research Pipeline

## Overview

Research Pipeline is a production-ready web application that enables users to conduct comprehensive research using multiple methods, compare approaches, evaluate sources, verify claims, and track research evolution over time. The application integrates Perplexity AI for web research and Claude for synthesis/evaluation, providing dual-method comparison for cost and quality analysis.

**Target Users:** Researchers, analysts, investors, competitive intelligence professionals
**Primary Goal:** Enable efficient, high-quality research with transparent cost tracking and source verification

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      RESEARCH PIPELINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React 18 + TypeScript)                           │
│  ├─ Main App (page.tsx)                                     │
│  ├─ Research Methods (Perplexity+Claude, Perplexity-only)  │
│  ├─ Frameworks System (5 built-in + custom)               │
│  ├─ Synthesis Engine (multi-search)                        │
│  ├─ Source Evaluation Panel                                │
│  ├─ Claim Verification Panel                               │
│  ├─ Annotations System                                     │
│  └─ Timeline Comparison                                    │
│                                                             │
│  API Layer (Next.js Routes)                                │
│  ├─ /api/research (Perplexity + optional Claude)          │
│  ├─ /api/frameworks/run (Framework execution)             │
│  ├─ /api/synthesis/combine (Multi-search synthesis)       │
│  ├─ /api/research-history/* (CRUD operations)             │
│  └─ /api/export (Markdown/Word/PDF generation)            │
│                                                             │
│  Storage Layer                                             │
│  ├─ Supabase PostgreSQL (30-day research history)         │
│  ├─ LocalStorage (annotations, custom templates)          │
│  └─ Environment Variables (API keys)                      │
│                                                             │
│  External APIs                                             │
│  ├─ Perplexity API (sonar model, web research)           │
│  └─ Claude API (Opus 4.1, synthesis & evaluation)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Research Initiation**
   - User enters topic → Selects method (P+C, P-only, or Framework)
   - Request streams to API via SSE (Server-Sent Events)
   - Progress updates sent in real-time to frontend

2. **Single Search (Perplexity-only or Perplexity+Claude)**
   - Perplexity API called with topic and method-specific prompt
   - For comparisons: auto-routes to Perplexity-only (better structure)
   - For hybrid: Claude synthesis wraps Perplexity findings
   - Results saved to Supabase (with 30-day TTL)

3. **Framework Execution**
   - Runs 5 sequential Perplexity searches (one per query)
   - Aggregates results
   - Claude synthesizes using framework-specific prompt
   - Single result combines all findings

4. **Multi-Search Synthesis**
   - User selects 2+ past searches from history
   - Claude analyzes relationships across searches
   - Creates unified narrative connecting insights
   - Shows source attribution

5. **Post-Processing**
   - Source extraction (citations)
   - Claim extraction (factual assertions)
   - Credibility scoring
   - Contradiction detection
   - All stored in state (not persisted)

---

## Tech Stack

### Frontend
- **Framework:** React 18 (with TypeScript)
- **Styling:** CSS Modules (scoped, zero-runtime)
- **HTTP Client:** Fetch API with SSE streaming
- **State Management:** React Hooks (useState, useEffect)
- **Build/Runtime:** Next.js App Router

### Backend
- **Framework:** Next.js 14+ (API Routes)
- **Runtime:** Node.js (Vercel deployment)
- **API Pattern:** RESTful with SSE for streaming
- **Authentication:** Environment variables (API keys)

### Database & Storage
- **Primary:** Supabase PostgreSQL
  - Table: `research_results` (topic, method, summary, findings, cost, created_at)
  - TTL: Auto-delete records older than 30 days
  - Row-level security: All users can read/write
- **Secondary:** Browser LocalStorage
  - Annotations (per research by ID)
  - Custom templates
  - Client-side only, no sync

### External Services
- **Web Research:** Perplexity API (sonar model, $0.005/1K in, $0.015/1K out)
- **Synthesis:** Claude Opus 4.1 ($3/1M in, $15/1M out)
- **Deployment:** Vercel (automatic from git)
- **Repository:** GitHub (public)

### Libraries & Dependencies
```json
{
  "react": "^18.3.0",
  "next": "^14.0.0",
  "@supabase/supabase-js": "^2.38.0",
  "typescript": "^5.0.0"
}
```

---

## Data Model

### Research Result (Supabase)
```typescript
{
  id: UUID,
  topic: string,
  method: "perplexity-only" | "perplexity-claude" | "framework-synthesis" | "multi-search-synthesis",
  summary: string,
  findings: Finding[],
  synthesis?: string,
  framework?: string,
  frameworkId?: string,
  searchCount?: number,
  searches?: { topic: string, date: string }[],
  cost: {
    model: string,
    estimated_cost: string,
    prompt_tokens?: number,
    completion_tokens?: number,
    perplexity_cost?: string,
    claude_cost?: string,
    total_estimated_cost?: string
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

### Finding
```typescript
{
  text: string,
  source: {
    url: string,
    title: string,
    domain: string,
    retrieved_at: string
  },
  scores: {
    relevance: 0-1,
    credibility: 0-1,
    recency: 0-1,
    combined: 0-1
  }
}
```

### Source
```typescript
{
  url: string,
  title: string,
  domain: string,
  citationCount: number,
  appearances: Array<{ searchTopic: string, context: string }>,
  credibilityScore: 0-1,
  credibilityFactors: {
    domainReputation: 0-1,
    recency: 0-1,
    academicCredibility: 0-1,
    authoritative: 0-1
  }
}
```

### Claim
```typescript
{
  text: string,
  citations: Array<{ title: string, url: string }>,
  isSupported: boolean,
  appearanceCount: number,
  appearances: Array<{ searchTopic: string, context: string }>,
  conflicts: string[]
}
```

### Custom Template
```typescript
{
  id: string,
  name: string,
  description: string,
  icon: string,
  queries: Array<{ label: string, query: string }>,
  created_at: string,
  updated_at: string
}
```

### Annotation
```typescript
{
  id: string,
  researchId: string,
  section: string,
  text: string,
  created_at: string,
  updated_at: string
}
```

---

## Key Decisions & Tradeoffs

### 1. Dual Research Methods
**Decision:** Support both Perplexity-only and hybrid (Perplexity+Claude) approaches
- **Rationale:** Enable user to compare cost vs. quality directly
- **Tradeoff:** Added complexity vs. clearer comparison data
- **Result:** Auto-routes comparisons to Perplexity-only for optimal output

### 2. SSE Streaming for Real-time Progress
**Decision:** Use Server-Sent Events instead of polling
- **Rationale:** Real-time UX, efficient, simple implementation
- **Tradeoff:** One-directional (server→client), requires long-lived connection
- **Benefit:** Smooth progress updates during long-running operations

### 3. LocalStorage for Annotations & Templates
**Decision:** Store in browser instead of Supabase
- **Rationale:** Fast, no backend needed, works offline
- **Tradeoff:** Data not synced across devices, lost if browser cleared
- **Benefit:** Simple, reduces API calls, privacy-preserving

### 4. Citation Extraction from Markdown
**Decision:** Parse `[title](url)` format instead of JSON structure
- **Rationale:** Works with any text output, flexible
- **Tradeoff:** May miss citations in other formats
- **Benefit:** Lightweight, regex-based, no special API needed

### 5. Credibility Scoring Algorithm
**Decision:** Weighted combination of domain reputation, academic status, authority
- **Rationale:** Practical heuristic without ML
- **Tradeoff:** Simplified, may misrate edge cases
- **Benefit:** Fast, deterministic, explainable scores

### 6. Framework Synthesis Prompt
**Decision:** User-customizable synthesis instructions per template
- **Rationale:** Different research types need different synthesis approaches
- **Tradeoff:** More complex, requires good prompts
- **Benefit:** High-quality tailored results

---

## API Endpoints

### POST /api/research
**Stream-based research execution**
- Input: `{ topic, researchMethod, max_results?, similarity_threshold?, min_score? }`
- Output: SSE stream with events: `progress`, `complete`, `error`
- Methods: Perplexity-only, Perplexity+Claude (with auto-routing for comparisons)
- Cost Tracking: Actual tokens from API responses

### POST /api/frameworks/run
**Execute research framework**
- Input: `{ topic, frameworkId }`
- Output: SSE stream (same format as /api/research)
- Execution: Sequential Perplexity searches, Claude synthesis
- Saves: Result to Supabase history

### POST /api/synthesis/combine
**Synthesize multiple searches**
- Input: `{ searches: Research[], title: string }`
- Output: SSE stream with unified synthesis
- Process: Claude analyzes relationships across searches
- Limit: Max 10 searches at once

### GET /api/research-history/get
**Retrieve past research**
- Output: Array of Research results (100 max, ordered by created_at DESC)
- Filter: None (all user research visible)

### DELETE /api/research-history/delete
**Remove research result**
- Query: `id` (research UUID)
- Effect: Soft delete or permanent removal

### POST /api/export
**Generate downloadable research**
- Input: `{ result, format: "markdown"|"docx"|"pdf", citationFormat: "none"|"apa"|"mla"|"chicago" }`
- Output: Binary file download
- Formats: Markdown (.md), Word (.docx), PDF (via browser print)

---

## Known Limitations & Open Risks

### Limitations
1. **Citation Accuracy:** Relies on regex parsing; complex markdown may be missed
2. **Claim Extraction:** Heuristic-based; may extract non-factual statements
3. **Source Credibility:** Simplified scoring; doesn't verify current domain reputation
4. **Custom Templates:** Limited to 10 queries; no complex branching logic
5. **LocalStorage Size:** Browser storage limited (~5-10MB); annotation sync manual
6. **30-day History:** Automatic deletion; no archive functionality
7. **No Authentication:** All users share history (design choice for MVP)

### Risks
1. **API Rate Limits:** Perplexity/Claude may throttle; no retry logic implemented
2. **Streaming Failures:** SSE connection drops may lose partial results
3. **Cost Overruns:** Users can run expensive operations repeatedly
4. **Synthesis Quality:** Claude output depends on prompt quality; unpredictable
5. **Source Contradictions:** Detected but not resolved; user must decide
6. **Data Privacy:** Research stored in shared Supabase (consider restricting)

### Recommendations
- Add per-user row-level security to Supabase
- Implement exponential backoff retry for API calls
- Add usage quotas or rate limiting
- Create feedback loop to improve synthesis prompts
- Archive old research instead of deleting
- Add authentication layer (Google OAuth or similar)

---

## Performance Considerations

### Optimization Strategies
1. **SSE Streaming:** Renders results incrementally as they arrive
2. **LocalStorage Caching:** Annotations and templates load instantly
3. **Lazy Loading:** Modals only render when opened
4. **Deduplication:** Similar findings grouped to reduce DOM nodes
5. **Pagination:** History limited to 100 records

### Potential Bottlenecks
- Perplexity API latency (~5-10s per search)
- Claude synthesis latency (~10-15s for synthesis)
- Large result parsing (>10K findings)
- Supabase query on large history tables

### Monitoring Needs
- SSE connection stability
- API response times
- Error rates per endpoint
- Cost per research operation

---

## Security Considerations

### Current Approach
- Environment variables for API keys (not exposed to frontend)
- HTTPS only (Vercel default)
- No user authentication (MVP trade-off)
- Row-level security disabled (design choice)

### Recommendations
1. Implement user authentication (OAuth)
2. Enable Supabase RLS with user_id filtering
3. Rate limit API calls per user
4. Add CORS restrictions
5. Sanitize user input (topic, custom template names)
6. Add audit logging for API calls

---

## Deployment

### Current Setup
- **Platform:** Vercel (serverless)
- **Git:** GitHub (automatic deploys on push to main)
- **Environment:** Production from main branch
- **Domain:** https://research-pipeline-[hash].vercel.app

### Environment Variables
```
PERPLEXITY_API_KEY=sk_...
ANTHROPIC_API_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_...
SUPABASE_SERVICE_KEY=sb_secret_...
```

### Deployment Steps
1. Push to main branch
2. Vercel auto-builds (~2 min)
3. Tests run (none currently)
4. Deploy to production
5. URL available immediately

---

## Future Enhancements

See ENHANCEMENTS.md for detailed roadmap.

**Quick wins:**
- User authentication
- Email export
- Browser bookmarking
- Multi-language support

**Major features:**
- Team collaboration
- Research templates marketplace
- AI-powered claim verification
- Real-time search alerts
