// Core types for the Agent Orchestrator

export interface Agent {
  id: string
  name: string
  type: "crawler" | "scorer" | "drafter" | "analyzer" | "generator"
  status: "active" | "paused" | "error"
  version: string
  lastRun?: Date
  metrics?: {
    successRate: number
    avgLatency: number
    totalRuns: number
  }
}

export interface Case {
  id: string
  leadId: string
  companyName: string
  status: "running" | "paused" | "completed" | "failed"
  currentNode: string
  progress: number
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface ApprovalRequest {
  id: string
  caseId: string
  type: "initial_contact" | "legal_review" | "public_release"
  title: string
  description: string
  requester: string
  priority: "low" | "medium" | "high"
  status: "pending" | "approved" | "rejected"
  evidenceScore: number
  hasPII: boolean
  deadline: Date
  content?: any
  createdAt: Date
}

export interface DAGNode {
  id: string
  type: "agent" | "gate" | "hitl" | "ab"
  label: string
  agentType?: string
  status?: "pending" | "running" | "completed" | "failed"
  position: { x: number; y: number }
  data?: Record<string, any>
}

export interface DAGEdge {
  id: string
  source: string
  target: string
  type?: "dependency" | "data" | "conditional"
  label?: string
}

export interface Workflow {
  id: string
  name: string
  version: string
  status: "draft" | "canary" | "live"
  nodes: DAGNode[]
  edges: DAGEdge[]
  triggers: Trigger[]
  policies: Policy[]
  createdAt: Date
  updatedAt: Date
}

export interface Trigger {
  type: "cron" | "webhook" | "event" | "manual"
  config: Record<string, any>
}

export interface Policy {
  id: string
  type: "pii" | "brand" | "legal" | "cost" | "sla"
  rules: Record<string, any>
  enabled: boolean
}

export interface Evidence {
  id: string
  caseId: string
  nodeId: string
  sourceRef: string
  capturedAt: Date
  trustScore: number
  piiMaskDiff?: string
  content: any
}

export interface Metric {
  timestamp: Date
  name: string
  value: number
  labels?: Record<string, string>
}
