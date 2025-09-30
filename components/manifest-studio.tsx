"use client"

import { AppLayout } from "./app-layout"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { FileCode, Play, GitCompare, AlertCircle, CheckCircle } from "lucide-react"

export function ManifestStudio() {
  return (
    <AppLayout showTrustRibbon={false}>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Manifest YAML Studio</h1>
                <p className="text-sm text-muted-foreground mt-1">lead-to-deploy-orchestrator v1.0.0</p>
              </div>
              <Badge variant="outline" className="text-warning border-warning">
                Draft
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Dry Run
              </Button>
              <Button size="sm">Deploy to Canary</Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">Files</h3>
            <div className="space-y-1">
              {[
                "runbook.yaml",
                "problem_definition.yaml",
                "world_model.yaml",
                "policies/pii.yaml",
                "policies/brand.yaml",
                "policies/legal.yaml",
                "tests/fixtures/sample.json",
              ].map((file) => (
                <button
                  key={file}
                  className="w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4 text-muted-foreground" />
                  <span className={file === "runbook.yaml" ? "font-medium" : ""}>{file}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="yaml" className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4">
                <TabsTrigger value="yaml">YAML</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="diff">Diff</TabsTrigger>
                <TabsTrigger value="dryrun">Dry Run</TabsTrigger>
              </TabsList>

              <TabsContent value="yaml" className="flex-1 overflow-auto p-6 mt-0">
                <Card className="p-6 font-mono text-sm">
                  <pre className="text-foreground/90">
                    {`apiVersion: agi.run/v1
kind: Agent
metadata:
  name: "lead-to-deploy-orchestrator"
  version: "1.0.0"
  owner: "dev-team-ops"

spec:
  role: >
    会社AGIのオーケストレータ。Manifest/Planを読み込み、
    検知→分析→連絡→アポ→資料→議事録→分析→提案→
    配備準備→評価→公開の二重DAG（作業×ガバナンス）を実行。

  triggers:
    - type: "cron"
      expr: "15 * * * *"
    - type: "webhook"
      name: "github.push"
    - type: "event"
      name: "email.reply_received"
    - type: "manual"
      name: "run-now"

  policies:
    sla:
      timeout_sec: 300
      retries: 2
    pii:
      mode: "mask-and-consent"
      detectors: ["jp_name","email","phone"]
      block_on_unconsented: true
    governance:
      gates:
        - id: "initial_contact"
          approvers: ["SalesMgr","Legal"]
        - id: "legal_review"
          approvers: ["Legal"]
        - id: "public_release"
          approvers: ["Safety","Legal"]`}
                  </pre>
                </Card>
              </TabsContent>

              <TabsContent value="schema" className="flex-1 overflow-auto p-6 mt-0">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Schema Validation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>All required fields present</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Trigger configuration valid</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Policy rules compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span>Warning: Cost SLO approaching limit</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="diff" className="flex-1 overflow-auto p-6 mt-0">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Changes vs Live</h3>
                  <div className="font-mono text-sm space-y-2">
                    <div className="text-destructive">- timeout_sec: 240</div>
                    <div className="text-success">+ timeout_sec: 300</div>
                    <div className="text-success">+ retries: 2</div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">Impact: 12 active cases will use new timeout</p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dryrun" className="flex-1 overflow-auto p-6 mt-0">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-2">Estimated Cost</h3>
                    <p className="text-2xl font-bold">$8.50</p>
                    <p className="text-xs text-muted-foreground mt-1">per case</p>
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-2">P95 Latency</h3>
                    <p className="text-2xl font-bold">4.2s</p>
                    <p className="text-xs text-muted-foreground mt-1">within SLO</p>
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-2">Safety Score</h3>
                    <p className="text-2xl font-bold text-success">0.99</p>
                    <p className="text-xs text-muted-foreground mt-1">passing</p>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
