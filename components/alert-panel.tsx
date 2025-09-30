"use client"

import { Card } from "./ui/card"
import { AlertTriangle, Info, CheckCircle } from "lucide-react"

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Canary at 10%",
    message: "Monitoring metrics before auto-promote",
    time: "5m ago",
  },
  {
    id: 2,
    type: "info",
    title: "HITL Required",
    message: "Sales meeting scheduled for Case #C-892",
    time: "15m ago",
  },
  {
    id: 3,
    type: "success",
    title: "Auto-promoted",
    message: "Runbook v1.2.3 promoted to Live",
    time: "1h ago",
  },
]

export function AlertPanel() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Alerts & Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">Recent system events</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.type === "warning" ? AlertTriangle : alert.type === "success" ? CheckCircle : Info
          const colorClass =
            alert.type === "warning" ? "text-warning" : alert.type === "success" ? "text-success" : "text-primary"

          return (
            <div key={alert.id} className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
