"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Lock, Scale, DollarSign, Clock, Plus } from "lucide-react"
import { AppLayout } from "./app-layout"

const policies = [
  {
    id: "pii-handling",
    category: "PII",
    name: "PII マスキング・同意管理",
    description: "個人情報は mask-and-consent で処理",
    severity: "high",
    enabled: true,
    violations: 0,
  },
  {
    id: "brand-safety",
    category: "Brand",
    name: "ブランド安全性チェック",
    description: "不適切な表現・トーンを検出",
    severity: "medium",
    enabled: true,
    violations: 2,
  },
  {
    id: "legal-compliance",
    category: "Legal",
    name: "法務コンプライアンス",
    description: "特商法・プライバシーポリシー準拠",
    severity: "high",
    enabled: true,
    violations: 0,
  },
  {
    id: "cost-budget",
    category: "Cost",
    name: "コスト予算制限",
    description: "日次 $300、Case あたり $10 上限",
    severity: "medium",
    enabled: true,
    violations: 1,
  },
  {
    id: "sla-enforcement",
    category: "SLA",
    name: "SLA 強制",
    description: "ノード p95 ≤ 5s、承認待ち ≤ 30m",
    severity: "medium",
    enabled: true,
    violations: 3,
  },
  {
    id: "outbound-domain",
    category: "Legal",
    name: "外部送信ドメイン制限",
    description: "許可リストのドメインのみ送信可",
    severity: "high",
    enabled: true,
    violations: 0,
  },
]

export function PoliciesManagement() {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "PII":
        return Lock
      case "Brand":
        return Shield
      case "Legal":
        return Scale
      case "Cost":
        return DollarSign
      case "SLA":
        return Clock
      default:
        return Shield
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <AppLayout title="Policies" description="ガバナンスポリシーの管理">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規ポリシー
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">有効ポリシー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.filter((p) => p.enabled).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">総違反数（24h）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {policies.reduce((sum, p) => sum + p.violations, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">高重要度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {policies.filter((p) => p.severity === "high").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">自動停止</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">0</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Policies</TabsTrigger>
            <TabsTrigger value="PII">PII</TabsTrigger>
            <TabsTrigger value="Brand">Brand</TabsTrigger>
            <TabsTrigger value="Legal">Legal</TabsTrigger>
            <TabsTrigger value="Cost">Cost</TabsTrigger>
            <TabsTrigger value="SLA">SLA</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {policies.map((policy) => {
              const Icon = getCategoryIcon(policy.category)
              return (
                <Card key={policy.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-muted rounded">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{policy.name}</CardTitle>
                            <Badge variant={getSeverityColor(policy.severity)}>{policy.severity}</Badge>
                            <Badge variant="outline">{policy.category}</Badge>
                          </div>
                          <CardDescription>{policy.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {policy.violations > 0 ? (
                              <span className="text-yellow-400">{policy.violations} 件</span>
                            ) : (
                              <span className="text-green-400">違反なし</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">24h</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={policy.enabled} className="sr-only peer" readOnly />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </TabsContent>

          {["PII", "Brand", "Legal", "Cost", "SLA"].map((category) => (
            <TabsContent key={category} value={category} className="space-y-3">
              {policies
                .filter((p) => p.category === category)
                .map((policy) => {
                  const Icon = getCategoryIcon(policy.category)
                  return (
                    <Card key={policy.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div className="flex-1">
                            <CardTitle className="text-base">{policy.name}</CardTitle>
                            <CardDescription>{policy.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  )
}
