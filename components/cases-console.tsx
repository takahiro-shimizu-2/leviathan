"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { AppLayout } from "./app-layout"
import {
  Pause,
  RotateCcw,
  StopCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  GitBranch,
  DollarSign,
} from "lucide-react"
import type { Case } from "@/lib/types"

const mockCases: Case[] = [
  {
    id: "case-042",
    runbookId: "rb-001",
    runbookVersion: "v0.3.12",
    status: "Running",
    environment: "Staging",
    canaryPercent: 10,
    label: "ACME-042",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    startedAt: new Date(Date.now() - 3000000).toISOString(),
    progress: 45,
    currentNode: "N4-DraftEmails",
    metrics: {
      e2eMs: 2400000,
      approvalsMs: 600000,
      retries: 1,
      rollback: false,
      safetyIncidents: 0,
      costUSD: 2.35,
    },
  },
  {
    id: "case-043",
    runbookId: "rb-001",
    runbookVersion: "v0.3.12",
    status: "WaitingApproval",
    environment: "Staging",
    canaryPercent: 10,
    label: "ACME-043",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    startedAt: new Date(Date.now() - 6000000).toISOString(),
    progress: 60,
    currentNode: "G1-InitialContact",
    metrics: {
      e2eMs: 3600000,
      approvalsMs: 1200000,
      retries: 0,
      rollback: false,
      safetyIncidents: 0,
      costUSD: 3.2,
    },
  },
  {
    id: "case-044",
    runbookId: "rb-001",
    runbookVersion: "v0.3.13",
    status: "Completed",
    environment: "Production",
    canaryPercent: 100,
    label: "ACME-044",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    startedAt: new Date(Date.now() - 82800000).toISOString(),
    completedAt: new Date(Date.now() - 79200000).toISOString(),
    progress: 100,
    currentNode: "N10-HandoffPackage",
    metrics: {
      e2eMs: 3600000,
      approvalsMs: 900000,
      retries: 0,
      rollback: false,
      safetyIncidents: 0,
      costUSD: 8.5,
    },
  },
]

export function CasesConsole() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(mockCases[0])
  const [filter, setFilter] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running":
        return "default"
      case "Completed":
        return "secondary"
      case "Failed":
        return "destructive"
      case "WaitingApproval":
        return "outline"
      case "Paused":
        return "outline"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Running":
        return <Activity className="h-3 w-3 animate-pulse" />
      case "Completed":
        return <CheckCircle2 className="h-3 w-3" />
      case "Failed":
        return <XCircle className="h-3 w-3" />
      case "WaitingApproval":
        return <Clock className="h-3 w-3" />
      case "Paused":
        return <Pause className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <AppLayout title="Cases" description="実行インスタンスの監視">
      <div className="flex h-[calc(100vh-16rem)] gap-4">
        {/* Left: Case List */}
        <div className="w-96 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Case 一覧</CardTitle>
              <CardDescription>実行インスタンスの監視</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="running">Running</TabsTrigger>
                  <TabsTrigger value="waiting">Waiting</TabsTrigger>
                  <TabsTrigger value="completed">Done</TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="m-0">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="divide-y">
                      {mockCases.map((caseItem) => (
                        <button
                          key={caseItem.id}
                          onClick={() => setSelectedCase(caseItem)}
                          className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                            selectedCase?.id === caseItem.id ? "bg-accent" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(caseItem.status)} className="gap-1">
                                {getStatusIcon(caseItem.status)}
                                {caseItem.status}
                              </Badge>
                            </div>
                            <Badge variant="outline">{caseItem.environment}</Badge>
                          </div>

                          <div className="text-sm font-medium mb-1">{caseItem.label}</div>

                          <div className="text-xs text-muted-foreground mb-2">
                            {caseItem.id} • {caseItem.runbookVersion}
                          </div>

                          <div className="space-y-2">
                            <Progress value={caseItem.progress} className="h-1" />
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{caseItem.currentNode}</span>
                              <span className="font-mono">{caseItem.progress}%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />${caseItem.metrics.costUSD.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" />
                              {caseItem.metrics.retries}
                            </div>
                            {caseItem.canaryPercent < 100 && (
                              <div className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {caseItem.canaryPercent}%
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Case Detail */}
        {selectedCase && (
          <div className="flex-1 space-y-4">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedCase.label}
                      <Badge variant={getStatusColor(selectedCase.status)}>{selectedCase.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {selectedCase.id} • {selectedCase.runbookVersion} • {selectedCase.environment}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      一時停止
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      部分再実行
                    </Button>
                    <Button variant="destructive" size="sm">
                      <StopCircle className="h-4 w-4 mr-2" />
                      Kill Switch
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    進捗
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{selectedCase.progress}%</div>
                  <Progress value={selectedCase.progress} className="h-2" />
                  <div className="text-sm text-muted-foreground mt-2">現在のノード: {selectedCase.currentNode}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    実行時間
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{Math.floor(selectedCase.metrics.e2eMs / 60000)}m</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">承認待ち</span>
                    <span className="font-mono">{Math.floor(selectedCase.metrics.approvalsMs / 60000)}m</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">再試行回数</span>
                    <span className="font-mono">{selectedCase.metrics.retries}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    コスト
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">${selectedCase.metrics.costUSD.toFixed(2)}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">予算</span>
                    <span className="font-mono">$10.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">使用率</span>
                    <span className="font-mono">{((selectedCase.metrics.costUSD / 10) * 100).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    安全性
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-green-400">{selectedCase.metrics.safetyIncidents}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">逸脱件数</span>
                    <span className="font-mono">{selectedCase.metrics.safetyIncidents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">ロールバック</span>
                    <span className="font-mono">{selectedCase.metrics.rollback ? "あり" : "なし"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">実行タイムライン</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {[
                      { node: "N1-DetectLeads", status: "Completed", duration: "45s", cost: 0.12 },
                      { node: "N2-AnalyzeCompany", status: "Completed", duration: "120s", cost: 0.35 },
                      { node: "N3-FindContacts", status: "Completed", duration: "30s", cost: 0.08 },
                      { node: "N4-DraftEmails", status: "Running", duration: "180s", cost: 0.52 },
                      { node: "G1-InitialContact", status: "Pending", duration: "-", cost: 0 },
                      { node: "N5-SendEmails", status: "Pending", duration: "-", cost: 0 },
                      { node: "N6-ScheduleMeeting", status: "Pending", duration: "-", cost: 0 },
                    ].map((node, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {node.status === "Completed" && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                          {node.status === "Running" && <Activity className="h-5 w-5 text-primary animate-pulse" />}
                          {node.status === "Pending" && <Clock className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{node.node}</div>
                          <div className="text-xs text-muted-foreground">
                            {node.duration} • ${node.cost.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant="outline">{node.status}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
