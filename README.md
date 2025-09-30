# AGI Agent Orchestrator Platform

Enterprise AI Agent Orchestration Platform for managing complex multi-agent workflows from lead detection to deployment.

## Features

### 🎯 Mission Control Dashboard
- Real-time KPI monitoring (reply rate, meeting hold rate, deploy success)
- Trust ribbon with compliance metrics (PII, brand, cost, SLA, safety)
- Approval queue with evidence scoring
- Alert panel for critical notifications

### 📝 Manifest YAML Studio
- YAML editor with schema validation and auto-completion
- Diff view comparing draft vs live versions
- Dry-run simulation with cost and latency estimates
- Policy compliance checking

### 🔀 Orchestrator Canvas
- Visual DAG workflow editor
- Dual-layer visualization (work DAG + governance layer)
- Node library with agents, gates, and control nodes
- Real-time execution monitoring
- Evidence ledger integration

### ✅ Governance & Approvals
- Multi-stage approval gates (initial contact, legal review, public release)
- Evidence-based decision making with trust scores
- PII detection and masking
- Audit trail for compliance

### 📊 Observability
- Metrics dashboard with time-series charts
- Distributed tracing with OpenTelemetry
- SLO monitoring and alerting
- Cost tracking and budget management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS v4
- **LLM**: Gemini 2.5 Pro (via Vercel AI SDK)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Dark theme optimized for enterprise use

## LLM Configuration

The platform uses Google's Gemini 2.5 Pro for all AI agent operations:

\`\`\`typescript
import { generateText } from 'ai'

const { text } = await generateText({
  model: 'google/gemini-2.5-pro-latest',
  prompt: 'Your prompt here',
  temperature: 0.2,
})
\`\`\`

### Agent Prompts

Pre-configured prompts for specialized agents:
- **Lead Scoring**: Analyzes company data and scores leads
- **Email Drafting**: Creates personalized outreach emails
- **Meeting Analysis**: Extracts insights from meeting transcripts
- **Document Generation**: Creates sales decks and proposals

See `lib/gemini.ts` for full implementation.

## Database Setup

### Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Add environment variables to your Vercel project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Run the database migration:
   - Execute `scripts/001_create_tables.sql` in your Supabase SQL editor

### Schema Overview

- **cases**: Workflow execution instances
- **approval_requests**: Governance approval queue
- **agents**: Agent registry and configuration
- **evidence**: Evidence ledger with trust scores
- **workflows**: DAG definitions and versions
- **metrics**: Time-series metrics data
- **audit_log**: Compliance audit trail

## Key Concepts

### Dual DAG Architecture

The platform uses a dual-layer DAG:
1. **Work DAG**: Agent tasks and data flow
2. **Governance Layer**: Approval gates and policy checks

### Evidence-Based Execution

Every agent action is backed by evidence:
- Source references and citations
- Trust scores (0-1 scale)
- PII masking diffs
- Timestamp and provenance

### RBAC Roles

- **Exec**: Full control, canary promotion, kill switch
- **Operator**: Start/pause cases, insert HITL nodes
- **Reviewer**: Comment and request changes
- **Sales/SalesLead/SalesMgr**: Sales operations and approvals
- **Legal**: Legal review and compliance
- **Safety**: Safety review and incident response

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\`

## Deployment

Deploy to Vercel with one click or via CLI:

\`\`\`bash
vercel deploy
\`\`\`

Make sure to configure environment variables in your Vercel project settings.

## License

Proprietary - AGI Company
