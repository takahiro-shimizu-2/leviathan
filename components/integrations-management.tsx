"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, Mail, Calendar, MessageSquare, Github, CheckCircle2, XCircle } from "lucide-react"
import { AppLayout } from "./app-layout"

const integrations = [
  {
    id: "gmail",
    name: "Gmail",
    description: "メール送信・受信",
    icon: Mail,
    status: "connected",
    lastSync: "2分前",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "ミーティングスケジュール",
    icon: Calendar,
    status: "connected",
    lastSync: "5分前",
  },
  {
    id: "slack",
    name: "Slack",
    description: "通知・アラート",
    icon: MessageSquare,
    status: "connected",
    lastSync: "1分前",
  },
  {
    id: "github",
    name: "GitHub",
    description: "リポジトリ情報取得",
    icon: Github,
    status: "connected",
    lastSync: "10分前",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "データベース",
    icon: Database,
    status: "connected",
    lastSync: "リアルタイム",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "メール送信・受信",
    icon: Mail,
    status: "disconnected",
    lastSync: "-",
  },
]

export function IntegrationsManagement() {
  return (
    <AppLayout title="Integrations" description="外部サービス連携の管理">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button>
            <Database className="h-4 w-4 mr-2" />
            新規連携
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">接続済み</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {integrations.filter((i) => i.status === "connected").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">未接続</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {integrations.filter((i) => i.status === "disconnected").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">総連携数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrations.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {integrations.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={integration.status === "connected" ? "default" : "secondary"}>
                      {integration.status === "connected" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">最終同期</span>
                    <span className="font-mono">{integration.lastSync}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.status === "connected" ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          設定
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          切断
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="w-full">
                        接続
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
