"use client"

import { useState } from "react"
import { AppLayout } from "./app-layout"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Pause, RotateCcw, Layers, Zap, CheckSquare, GitBranch, Database } from "lucide-react"

export function OrchestratorCanvas() {
  const [showGovernance, setShowGovernance] = useState(true)

  return (
    <AppLayout showTrustRibbon={false}>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Orchestrator Canvas</h1>
              <Badge variant="outline">Case #C-1234</Badge>
              <Badge className="bg-success text-success-foreground">Running</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGovernance(!showGovernance)}>
                <Layers className="w-4 h-4 mr-2" />
                {showGovernance ? "Hide" : "Show"} Governance
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Replay
              </Button>
              <Button variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">Node Library</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-muted-foreground mb-2">AGENTS</h4>
                <div className="space-y-1">
                  {[
                    { name: "Web Crawler", icon: Database },
                    { name: "Lead Scorer", icon: Zap },
                    { name: "Email Drafter", icon: Zap },
                    { name: "Meeting Analyzer", icon: Zap },
                  ].map((agent) => {
                    const Icon = agent.icon
                    return (
                      <button
                        key={agent.name}
                        className="w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        <span>{agent.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-muted-foreground mb-2">GATES</h4>
                <div className="space-y-1">
                  {["Initial Contact", "Legal Review", "Public Release"].map((gate) => (
                    <button
                      key={gate}
                      className="w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4 text-warning" />
                      <span>{gate}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-muted-foreground mb-2">CONTROL</h4>
                <div className="space-y-1">
                  {[
                    { name: "HITL Node", icon: CheckSquare },
                    { name: "AB Test", icon: GitBranch },
                  ].map((control) => {
                    const Icon = control.icon
                    return (
                      <button
                        key={control.name}
                        className="w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{control.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-6 bg-background">
              <Card className="h-full min-h-[600px] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      DAG Canvas - Drag nodes from the library to build your workflow
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {showGovernance ? "Governance layer visible" : "Governance layer hidden"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="w-96 border-l border-border bg-card p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Node Details</h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2">Selected Node</h4>
                <p className="text-sm text-muted-foreground">Select a node to view details</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Execution Stats</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-lg font-semibold">8/18</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Evidence</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Trust Score</span>
                    <span className="font-medium text-success">0.94</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Citations</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">PII Masked</span>
                    <span className="font-medium">3 fields</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Policies Applied</h4>
                <div className="space-y-2">
                  {[
                    { name: "PII Compliance", status: "pass" },
                    { name: "Brand Guidelines", status: "pass" },
                    { name: "Cost SLO", status: "pass" },
                  ].map((policy) => (
                    <div key={policy.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{policy.name}</span>
                      <Badge variant="outline" className="text-success border-success">
                        {policy.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
