"use client"

import { Badge } from "@/components/ui/badge"
import { AppLayout } from "./app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, User, Bell, Shield, Globe } from "lucide-react"

export function SettingsManagement() {
  return (
    <AppLayout title="Settings" description="システム設定と環境変数" showTrustRibbon={false}>
      <div className="space-y-4 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">システム設定と環境変数</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              一般
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              アカウント
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              通知
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              セキュリティ
            </TabsTrigger>
            <TabsTrigger value="localization" className="gap-2">
              <Globe className="h-4 w-4" />
              地域化
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>組織設定</CardTitle>
                <CardDescription>組織の基本情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">組織名</Label>
                  <Input id="org-name" defaultValue="AGI株式会社" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain">ドメイン</Label>
                  <Input id="org-domain" defaultValue="agi.co.jp" />
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LLM 設定</CardTitle>
                <CardDescription>Gemini 2.5 Pro の設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-model">モデル</Label>
                  <Select defaultValue="gemini-2.5-pro">
                    <SelectTrigger id="llm-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input id="temperature" type="number" step="0.1" defaultValue="0.7" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input id="max-tokens" type="number" defaultValue="4096" />
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>予算設定</CardTitle>
                <CardDescription>コスト制限</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-budget">日次予算上限（USD）</Label>
                  <Input id="daily-budget" type="number" defaultValue="300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-budget">Case あたり上限（USD）</Label>
                  <Input id="case-budget" type="number" defaultValue="10" />
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>プロフィール</CardTitle>
                <CardDescription>アカウント情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input id="email" type="email" defaultValue="operator@agi.co.jp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">表示名</Label>
                  <Input id="display-name" defaultValue="Operator" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">ロール</Label>
                  <Select defaultValue="operator">
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exec">Exec</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>通知設定</CardTitle>
                <CardDescription>アラートと通知の管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: "approval-required", label: "承認リクエスト", defaultChecked: true },
                  { id: "case-completed", label: "Case 完了", defaultChecked: true },
                  { id: "case-failed", label: "Case 失敗", defaultChecked: true },
                  { id: "policy-violation", label: "ポリシー違反", defaultChecked: true },
                  { id: "budget-alert", label: "予算アラート", defaultChecked: true },
                  { id: "sla-breach", label: "SLA 超過", defaultChecked: false },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="rounded" />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
                <Button>保存</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>セキュリティ設定</CardTitle>
                <CardDescription>アクセス制御とセキュリティ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>二要素認証</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">有効</Badge>
                    <Button variant="outline" size="sm">
                      設定
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>セッションタイムアウト（分）</Label>
                  <Input type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label>IP 制限</Label>
                  <Input placeholder="192.168.1.0/24" />
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>地域化設定</CardTitle>
                <CardDescription>言語とタイムゾーン</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">言語</Label>
                  <Select defaultValue="ja">
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">タイムゾーン</Label>
                  <Select defaultValue="asia-tokyo">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia-tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">日付形式</Label>
                  <Select defaultValue="yyyy-mm-dd">
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
