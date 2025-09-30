"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Settings, Activity, CheckCircle2, XCircle } from "lucide-react"
import { AppLayout } from "./app-layout"

const agents = [
  {
    id: "lead-detector",
    name: "Lead Detector",
    description: "GitHub/HP を巡回して見込み客を検出",
    status: "active",
    version: "v1.2.0",
    calls: 1250,
    successRate: 98.5,
    avgLatency: 850,
  },
  {
    id: "company-analyzer",
    name: "Company Analyzer",
    description: "企業情報を分析してニーズを推定",
    status: "active",
    version: "v1.1.5",
    calls: 1180,
    successRate: 97.2,
    avgLatency: 2400,
  },
  {
    id: "contact-finder",
    name: "Contact Finder",
    description: "担当者の連絡先を特定",
    status: "active",
    version: "v1.0.8",
    calls: 1120,
    successRate: 95.8,
    avgLatency: 650,
  },
  {
    id: "email-drafter",
    name: "Email Drafter",
    description: "パーソナライズされたメールを生成",
    status: "active",
    version: "v2.0.1",
    calls: 1050,
    successRate: 99.1,
    avgLatency: 3200,
  },
  {
    id: "meeting-scheduler",
    name: "Meeting Scheduler",
    description: "カレンダー連携でアポイントを設定",
    status: "active",
    version: "v1.3.2",
    calls: 420,
    successRate: 96.5,
    avgLatency: 1800,
  },
  {
    id: "doc-generator",
    name: "Document Generator",
    description: "提案資料を自動生成",
    status: "maintenance",
    version: "v1.5.0",
    calls: 380,
    successRate: 98.9,
    avgLatency: 4500,
  },
]

export function AgentsManagement() {
  return (
    <AppLayout title="Agents" description="タスク特化エージェントの管理">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            新規エージェント
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">稼働中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {agents.filter((a) => a.status === "active").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">総実行回数（24h）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.calls, 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">平均成功率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Agents</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {agents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {agent.name}
                        </CardTitle>
                        <CardDescription className="mt-1">{agent.description}</CardDescription>
                      </div>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                        {agent.status === "active" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono">{agent.version}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">実行回数</div>
                        <div className="text-lg font-bold">{agent.calls.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">成功率</div>
                        <div className="text-lg font-bold text-green-400">{agent.successRate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">平均</div>
                        <div className="text-lg font-bold">{agent.avgLatency}ms</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Settings className="h-4 w-4 mr-2" />
                        設定
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Activity className="h-4 w-4 mr-2" />
                        ログ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-2 gap-4">
              {agents
                .filter((a) => a.status === "active")
                .map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <div className="grid grid-cols-2 gap-4">
              {agents
                .filter((a) => a.status === "maintenance")
                .map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
