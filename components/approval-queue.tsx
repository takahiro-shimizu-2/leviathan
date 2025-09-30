"use client"

import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

const approvals = [
  {
    id: "A-1234",
    type: "initial_contact",
    title: "Initial outreach to Acme Corp",
    requester: "Sales Agent",
    priority: "high",
    evidence: 0.92,
    pii: true,
    deadline: "2h",
  },
  {
    id: "A-1235",
    type: "legal_review",
    title: "Sales deck for TechStart Inc",
    requester: "Document Agent",
    priority: "medium",
    evidence: 0.88,
    pii: false,
    deadline: "4h",
  },
  {
    id: "A-1236",
    type: "public_release",
    title: "Deploy plan for CloudCo",
    requester: "Deploy Agent",
    priority: "high",
    evidence: 0.95,
    pii: false,
    deadline: "1h",
  },
]

export function ApprovalQueue() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Approval Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">{approvals.length} items pending review</p>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {approvals.map((approval) => (
          <div key={approval.id} className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-muted-foreground">{approval.id}</span>
                  <Badge variant={approval.priority === "high" ? "destructive" : "secondary"}>
                    {approval.priority}
                  </Badge>
                  {approval.pii && (
                    <Badge variant="outline" className="text-warning border-warning">
                      PII
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold">{approval.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">Requested by {approval.requester}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{approval.deadline}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Evidence</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: `${approval.evidence * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium">{(approval.evidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {approval.type}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button size="sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
