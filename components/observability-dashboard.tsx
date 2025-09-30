"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, BarChart3, Clock, Zap } from "lucide-react"
import { AppLayout } from "./app-layout"

export function ObservabilityDashboard() {
  return (
    <AppLayout title="Observability" description="メトリクス・ログ・トレース・アラート">
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">承認サイクル p50</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5m</div>
              <div className="text-xs text-green-400 mt-1">↓ 15% from last week</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">E2E 所要時間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45m</div>
              <div className="text-xs text-green-400 mt-1">↓ 8% from last week</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">安全逸脱</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">0</div>
              <div className="text-xs text-muted-foreground mt-1">Last 7 days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">成功率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <div className="text-xs text-green-400 mt-1">↑ 2% from last week</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">平均コスト</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$4.25</div>
              <div className="text-xs text-muted-foreground mt-1">per case</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="traces" className="gap-2">
              <Zap className="h-4 w-4" />
              Traces
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Case 実行数（24h）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const height = Math.random() * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-primary rounded-t transition-all hover:bg-primary/80"
                          style={{ height: `${height}%` }}
                          title={`${i}:00 - ${Math.floor(height * 1.5)} cases`}
                        />
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">承認待ち時間分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "p50", value: 12.5, max: 30 },
                      { label: "p75", value: 18.2, max: 30 },
                      { label: "p90", value: 24.8, max: 30 },
                      { label: "p95", value: 28.1, max: 30 },
                      { label: "p99", value: 29.5, max: 30 },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-mono">{item.label}</span>
                          <span className="font-mono">{item.value}m</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(item.value / item.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">コスト推移（7日間）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[120, 135, 128, 142, 138, 145, 152].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-green-500 rounded-t" style={{ height: `${(value / 200) * 100}%` }} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ノード別レイテンシ</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {[
                        { node: "N1-DetectLeads", p95: 850 },
                        { node: "N2-AnalyzeCompany", p95: 2400 },
                        { node: "N3-FindContacts", p95: 650 },
                        { node: "N4-DraftEmails", p95: 3200 },
                        { node: "N5-SendEmails", p95: 1200 },
                        { node: "N6-ScheduleMeeting", p95: 1800 },
                      ].map((item) => (
                        <div key={item.node} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-mono text-xs">{item.node}</span>
                            <span className="font-mono text-xs">{item.p95}ms</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.p95 > 5000 ? "bg-red-500" : item.p95 > 3000 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${(item.p95 / 5000) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Logs</CardTitle>
                <CardDescription>OpenTelemetry + JSONL</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 font-mono text-xs">
                    {Array.from({ length: 50 }).map((_, i) => {
                      const level = ["INFO", "WARN", "ERROR"][Math.floor(Math.random() * 3)]
                      const levelColor =
                        level === "ERROR" ? "text-red-400" : level === "WARN" ? "text-yellow-400" : "text-green-400"
                      return (
                        <div key={i} className="flex items-start gap-3 p-2 hover:bg-muted rounded">
                          <span className="text-muted-foreground">{new Date(Date.now() - i * 5000).toISOString()}</span>
                          <span className={levelColor}>{level}</span>
                          <span className="flex-1">[case-042] Node N4-DraftEmails completed in 3.2s, cost=$0.52</span>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traces" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distributed Traces</CardTitle>
                <CardDescription>OpenTelemetry Spans</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {[
                      { trace: "t-001", spans: 12, duration: 4500, status: "OK" },
                      { trace: "t-002", spans: 8, duration: 3200, status: "OK" },
                      { trace: "t-003", spans: 15, duration: 6800, status: "ERROR" },
                    ].map((trace) => (
                      <div key={trace.trace} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{trace.trace}</span>
                          <Badge variant={trace.status === "OK" ? "secondary" : "destructive"}>{trace.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trace.spans} spans • {trace.duration}ms
                        </div>
                        <div className="space-y-1">
                          {Array.from({ length: trace.spans }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <div className="flex-1 h-6 bg-primary/20 rounded" style={{ marginLeft: `${i * 8}px` }} />
                              <span className="text-xs font-mono">{Math.floor(Math.random() * 500)}ms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      severity: "high",
                      title: "承認待ち時間が SLA を超過",
                      message: "Case case-043 が 30分以上承認待ち状態です",
                      time: "5分前",
                    },
                    {
                      severity: "medium",
                      title: "コスト予算の 80% に到達",
                      message: "本日のコスト使用量が $240/$300 に達しました",
                      time: "15分前",
                    },
                    {
                      severity: "low",
                      title: "Canary デプロイ完了",
                      message: "Runbook v0.3.13 が Canary 10% で正常稼働中",
                      time: "1時間前",
                    },
                  ].map((alert, i) => (
                    <div
                      key={i}
                      className={`p-4 border-l-4 rounded ${
                        alert.severity === "high"
                          ? "border-red-500 bg-red-500/10"
                          : alert.severity === "medium"
                            ? "border-yellow-500 bg-yellow-500/10"
                            : "border-blue-500 bg-blue-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              alert.severity === "high"
                                ? "text-red-400"
                                : alert.severity === "medium"
                                  ? "text-yellow-400"
                                  : "text-blue-400"
                            }`}
                          />
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.time}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{alert.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
