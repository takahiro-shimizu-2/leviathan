"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AppLayout } from "./app-layout"
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  FileText,
  Rocket,
  MoreHorizontal,
  Shield,
  DollarSign,
  Zap,
  Eye,
  Download,
  GitCompare,
} from "lucide-react"
import type { ApprovalItem } from "@/lib/types"

const mockApprovals: ApprovalItem[] = [
  {
    id: "appr-001",
    type: "Outreach",
    status: "Waiting",
    requestedBy: "sales@agi.co.jp",
    deadline: new Date(Date.now() + 3600000).toISOString(),
    caseId: "case-042",
    runbookVersion: "v0.3.12",
    importance: "high",
    impactSummary: { recipients: 150 },
    evidenceBadge: { count: 5, trustAvg: 0.87 },
    risk: {
      pii: 0.12,
      brand: 0.05,
      legal: 0.08,
      costUSD: 2.5,
      slaMs: 1200,
    },
    previewRef: "email-draft-001",
  },
  {
    id: "appr-002",
    type: "Docs",
    status: "Waiting",
    requestedBy: "operator@agi.co.jp",
    deadline: new Date(Date.now() + 7200000).toISOString(),
    caseId: "case-043",
    runbookVersion: "v0.3.12",
    importance: "medium",
    impactSummary: { deployTargets: ["staging", "production"] },
    evidenceBadge: { count: 8, trustAvg: 0.92 },
    risk: {
      pii: 0.02,
      brand: 0.15,
      legal: 0.2,
      costUSD: 5.0,
      slaMs: 2400,
    },
    previewRef: "proposal-doc-002",
  },
  {
    id: "appr-003",
    type: "Deploy",
    status: "Waiting",
    requestedBy: "exec@agi.co.jp",
    deadline: new Date(Date.now() + 1800000).toISOString(),
    caseId: "case-044",
    runbookVersion: "v0.3.13",
    importance: "high",
    impactSummary: { deployTargets: ["production"] },
    evidenceBadge: { count: 12, trustAvg: 0.95 },
    risk: {
      pii: 0.01,
      brand: 0.08,
      legal: 0.12,
      costUSD: 15.0,
      slaMs: 3000,
    },
    previewRef: "deploy-package-003",
  },
]

export function ApprovalsCenter() {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(mockApprovals[0])
  const [activeTab, setActiveTab] = useState("Outreach")
  const [detailTab, setDetailTab] = useState("preview")

  const filteredApprovals = mockApprovals.filter((a) => a.type === activeTab)

  const getImportanceColor = (importance: string) => {
    switch (importance) {
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

  const getRiskColor = (score: number) => {
    if (score > 0.5) return "text-red-400"
    if (score > 0.2) return "text-yellow-400"
    return "text-green-400"
  }

  return (
    <AppLayout title="Approvals" description="ガバナンス承認センター">
      <div className="flex h-[calc(100vh-16rem)] gap-4">
        {/* Left: Approval Queue */}
        <div className="w-96 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">承認キュー</CardTitle>
              <CardDescription>Evidence → Diff → Risk を確認</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
                  <TabsTrigger value="Outreach" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Outreach
                  </TabsTrigger>
                  <TabsTrigger value="Docs" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Docs
                  </TabsTrigger>
                  <TabsTrigger value="Deploy" className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Deploy
                  </TabsTrigger>
                  <TabsTrigger value="Other" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    Other
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="m-0">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="divide-y">
                      {filteredApprovals.map((approval) => (
                        <button
                          key={approval.id}
                          onClick={() => setSelectedApproval(approval)}
                          className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                            selectedApproval?.id === approval.id ? "bg-accent" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={getImportanceColor(approval.importance)}>{approval.importance}</Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(approval.deadline).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <div className="text-sm font-medium mb-1">
                            {approval.type} #{approval.id.slice(-3)}
                          </div>

                          <div className="text-xs text-muted-foreground mb-2">
                            Case: {approval.caseId} • {approval.runbookVersion}
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>{approval.evidenceBadge.count}件</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>{(approval.evidenceBadge.trustAvg * 100).toFixed(0)}%</span>
                            </div>
                            {approval.impactSummary.recipients && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{approval.impactSummary.recipients}名</span>
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

        {/* Right: Detail Pane with Tabs */}
        {selectedApproval && (
          <div className="flex-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedApproval.type} #{selectedApproval.id.slice(-3)}
                    </CardTitle>
                    <CardDescription>
                      Case: {selectedApproval.caseId} • {selectedApproval.runbookVersion}
                    </CardDescription>
                  </div>
                  <Badge variant={getImportanceColor(selectedApproval.importance)}>{selectedApproval.importance}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col">
                  <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="h-4 w-4" />
                      プレビュー
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      リスク要約
                    </TabsTrigger>
                    <TabsTrigger value="diff" className="gap-2">
                      <GitCompare className="h-4 w-4" />
                      差分ビュー
                    </TabsTrigger>
                  </TabsList>

                  {/* Preview Tab */}
                  <TabsContent value="preview" className="flex-1 m-0 p-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 max-w-3xl">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-2">件名</div>
                          <div className="text-base font-medium">
                            貴社の採用課題を解決する AI ソリューションのご提案
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">本文</div>
                          <div className="text-sm space-y-3 leading-relaxed">
                            <p>株式会社ACME 人事部 御中</p>
                            <p>いつもお世話になっております。AGI株式会社の営業担当です。</p>
                            <p>
                              貴社が現在募集されている<mark className="bg-primary/20 px-1">エンジニア職</mark>
                              について、弊社の AI エージェントシステムが採用プロセスの効率化に貢献できると考え、
                              ご連絡させていただきました。
                            </p>
                            <p>
                              <mark className="bg-primary/20 px-1">GitHub の活動履歴</mark>から、貴社が Next.js と
                              TypeScript を活用した開発を進めていることを拝見しました。
                            </p>
                            <p>つきましては、30分程度のオンラインミーティングのお時間をいただけますでしょうか。</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">出典ハイライト</div>
                          <div className="space-y-2">
                            {[
                              { source: "GitHub: ACME/careers", confidence: 0.92 },
                              { source: "Company Website: /recruit", confidence: 0.88 },
                              { source: "LinkedIn: ACME Corp", confidence: 0.85 },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <span className="font-mono text-sm">{item.source}</span>
                                <Badge variant="outline">{(item.confidence * 100).toFixed(0)}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Risk Summary Tab */}
                  <TabsContent value="risk" className="flex-1 m-0 p-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 max-w-3xl">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">リスクスコア</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">PII</span>
                                <span className={`text-lg font-mono ${getRiskColor(selectedApproval.risk.pii)}`}>
                                  {(selectedApproval.risk.pii * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">個人情報検出</div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Brand</span>
                                <span className={`text-lg font-mono ${getRiskColor(selectedApproval.risk.brand)}`}>
                                  {(selectedApproval.risk.brand * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">ブランドリスク</div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Legal</span>
                                <span className={`text-lg font-mono ${getRiskColor(selectedApproval.risk.legal)}`}>
                                  {(selectedApproval.risk.legal * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">法的リスク</div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  Cost
                                </span>
                                <span className="text-lg font-mono">${selectedApproval.risk.costUSD.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">実行コスト</div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">安全化フィルタ</div>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                              <input type="checkbox" defaultChecked className="rounded w-4 h-4" />
                              <div>
                                <div className="text-sm font-medium">固有表現ロック</div>
                                <div className="text-xs text-muted-foreground">会社名・人名などの固有表現を保護</div>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                              <input type="checkbox" defaultChecked className="rounded w-4 h-4" />
                              <div>
                                <div className="text-sm font-medium">PII 黒塗り</div>
                                <div className="text-xs text-muted-foreground">個人情報を自動マスキング</div>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                              <input type="checkbox" className="rounded w-4 h-4" />
                              <div>
                                <div className="text-sm font-medium">送信先ドメイン制限</div>
                                <div className="text-xs text-muted-foreground">メール送信先をホワイトリストで制限</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">ポリシーヒット</div>
                          <div className="space-y-3">
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                                  MEDIUM
                                </Badge>
                                <span className="text-sm font-medium">PII Detection</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                会社名が本文に含まれています（mask-and-consent 適用済み）
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">Evidence Badge</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-muted rounded-lg text-center">
                              <div className="text-3xl font-bold mb-1">{selectedApproval.evidenceBadge.count}</div>
                              <div className="text-sm text-muted-foreground">出典数</div>
                            </div>
                            <div className="p-6 bg-muted rounded-lg text-center">
                              <div className="text-3xl font-bold mb-1">
                                {(selectedApproval.evidenceBadge.trustAvg * 100).toFixed(0)}%
                              </div>
                              <div className="text-sm text-muted-foreground">信頼度</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Diff View Tab */}
                  <TabsContent value="diff" className="flex-1 m-0 p-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 max-w-3xl">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">前回承認時からの変更</div>
                          <div className="space-y-1 font-mono text-sm p-4 bg-muted rounded-lg">
                            <div className="text-green-400">+ 貴社が現在募集されているエンジニア職について</div>
                            <div className="text-red-400">- 貴社の採用活動について</div>
                            <div className="text-green-400">+ GitHub の活動履歴から</div>
                            <div className="text-muted-foreground"> 弊社の AI エージェントシステムが</div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">変更理由</div>
                          <div className="text-sm leading-relaxed p-4 bg-muted rounded-lg">
                            より具体的な職種を明記し、GitHub の公開情報を根拠として追加することで、
                            パーソナライゼーションを強化しました。
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">影響範囲</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold mb-1">
                                {selectedApproval.impactSummary.recipients}名
                              </div>
                              <div className="text-sm text-muted-foreground">対象受信者</div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold mb-1">3件</div>
                              <div className="text-sm text-muted-foreground">関連 Case</div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-3">監査証跡</div>
                          <div className="space-y-3">
                            {[
                              { at: "2025-09-30 15:30", by: "operator@agi.co.jp", action: "承認リクエスト作成" },
                              { at: "2025-09-30 15:25", by: "system", action: "Evidence 収集完了" },
                              { at: "2025-09-30 15:20", by: "system", action: "ドラフト生成" },
                            ].map((log, i) => (
                              <div key={i} className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{log.action}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{log.at}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">{log.by}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer Actions */}
        {selectedApproval && (
          <div className="fixed bottom-0 left-64 right-0 p-4 bg-background border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                監査エクスポート
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                差戻
              </Button>
              <Button variant="outline" size="sm">
                修正リクエスト
              </Button>
              <Button size="sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                承認
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
